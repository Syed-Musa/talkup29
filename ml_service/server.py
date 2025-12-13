import os
import pickle
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow.keras.models import load_model
import numpy as np
import socketio
import uvicorn

# Resolve paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "lstm_sentence_autocomplete_model.h5")
TOKENIZER_PATH = os.path.join(BASE_DIR, "tokenizer.pickle")
PARAMS_PATH = os.path.join(BASE_DIR, "model_params.json")

with open(TOKENIZER_PATH, "rb") as f:
    tokenizer = pickle.load(f)

# load params with safe defaults
try:
    with open(PARAMS_PATH, "r") as f:
        params = json.load(f)
except Exception:
    params = {}

model = load_model(MODEL_PATH)
max_sequence_len = int(params.get("max_sequence_len", 20))
suggestions_count = int(params.get("suggestions_count", 3))

# create reverse mapping for tokenizer if available
if hasattr(tokenizer, "index_word") and tokenizer.index_word:
    index_word = tokenizer.index_word
else:
    # build index_word from word_index
    index_word = {idx: word for word, idx in getattr(tokenizer, "word_index", {}).items()}

# FastAPI setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO setup
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
sio_app = socketio.ASGIApp(sio, app)

class CompletionRequest(BaseModel):
    text: str

# Helper function for prediction
def predict_next_words(seed_text, n=None):
    if n is None:
        n = suggestions_count
    result = []
    for _ in range(n):
        seq = tokenizer.texts_to_sequences([seed_text])[0]
        seq = seq[-max_sequence_len:]
        if len(seq) < max_sequence_len:
            seq = np.pad(seq, (max_sequence_len - len(seq), 0))
        seq = np.array(seq).reshape(1, max_sequence_len)
        preds = model.predict(seq, verbose=0)
        # preds may have shape (1, vocab_size) or (1,1,vocab)
        preds_arr = np.asarray(preds)
        # flatten last dimension
        if preds_arr.ndim == 3:
            # shape (1,1,vocab) -> squeeze
            preds_arr = preds_arr.reshape(preds_arr.shape[0], preds_arr.shape[-1])
        # take argmax over vocab axis
        try:
            pred_index = int(np.argmax(preds_arr, axis=1)[0])
        except Exception:
            pred_index = int(np.argmax(preds_arr))

        # mapping: tokenizer indices are often 1-based; try exact, then offset by +1, -1
        word = index_word.get(pred_index)
        if word is None:
            word = index_word.get(pred_index + 1)
        if word is None:
            word = index_word.get(pred_index - 1)
        # debug log
        try:
            topk = 5
            flat = preds_arr.flatten()
            top_idx = flat.argsort()[-topk:][::-1]
            top_items = [(int(i), index_word.get(int(i), ""), float(flat[int(i)])) for i in top_idx]
        except Exception:
            top_items = []
        # If no word found, try to use top_items to select a candidate word
        if not word and top_items:
            # try mapping each top index with offsets
            for idx, w, score in top_items:
                cand = index_word.get(idx) or index_word.get(idx + 1) or index_word.get(idx - 1)
                if cand:
                    word = cand
                    break

        # print(f"[DEBUG] seed='{seed_text}' pred_index={pred_index} -> word='{word}' top={top_items}")
        if word:
            result.append(word)
            seed_text = seed_text + " " + word
        else:
            break
    return result


@app.get("/debug_predict")
def debug_predict(text: str = "hello", top_k: int = 10):
    """Return raw top_k prediction indices and scores for debugging."""
    seq = tokenizer.texts_to_sequences([text])[0]
    seq = seq[-max_sequence_len:]
    if len(seq) < max_sequence_len:
        seq = np.pad(seq, (max_sequence_len - len(seq), 0))
    seq = np.array(seq).reshape(1, max_sequence_len)
    preds = model.predict(seq, verbose=0)
    preds_arr = np.asarray(preds)
    if preds_arr.ndim == 3:
        preds_arr = preds_arr.reshape(preds_arr.shape[0], preds_arr.shape[-1])
    flat = preds_arr.flatten()
    top_idx = flat.argsort()[-top_k:][::-1]
    return {"top": [{"index": int(i), "word": index_word.get(int(i), ""), "score": float(flat[int(i)])} for i in top_idx]}

@app.post("/autocomplete")
async def autocomplete(req: CompletionRequest):
    suggestions = predict_next_words(req.text)
    return {"suggestions": suggestions}

@sio.event
async def connect(sid, environ):
    print("Client connected:", sid)


@sio.event
async def disconnect(sid):
    print("Client disconnected:", sid)


@sio.event
async def sentence_autocomplete(sid, data):
    text = data.get("text", "") if isinstance(data, dict) else ""
    # print(f"[EVENT] sentence_autocomplete from {sid}: '{text}'")
    suggestions = predict_next_words(text)
    # print(f"[EVENT] suggestions -> {suggestions}")
    await sio.emit("autocomplete_suggestions", {"suggestions": suggestions}, to=sid)

if __name__ == "__main__":
    uvicorn.run(sio_app, host="0.0.0.0", port=8000)
