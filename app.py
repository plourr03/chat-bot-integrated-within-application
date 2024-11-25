from flask import Flask, render_template, request, jsonify, Response, stream_with_context
import time
from openai import OpenAI
import json
import uuid
import queue
import threading
import os

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)

# Dictionary to store active streams for each user
active_streams = {}
stream_queues = {}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        user_id = data.get('user_id', str(uuid.uuid4()))
        chat_history = data.get('chat_history', [])
        # print(chat_history)

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Create a queue for this specific request
        message_queue = queue.Queue()
        stream_queues[user_id] = message_queue

        # Start processing in a separate thread
        thread = threading.Thread(
            target=process_chat_request,
            args=(user_message, user_id, message_queue, chat_history)
        )
        thread.start()

        return jsonify({'poll_id': user_id})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def process_chat_request(user_message, user_id, message_queue, chat_history):
    try:
        # Convert chat history to OpenAI format and add system message
        messages = [{"role": "system", "content": "You are a procurement assistant. You help track purchase orders, parts, and analyze email communications. For now just play pretend you are a helpful assistant."}]
        
        # Add chat history
        for msg in chat_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current user message
        # messages.append({"role": "user", "content": user_message})
        print(messages)

        # Create chat completion with streaming
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True
        )

        # Process the streaming response
        for chunk in response:
            if chunk and chunk.choices and chunk.choices[0].delta.content:
                message_queue.put({
                    'type': 'content',
                    'content': chunk.choices[0].delta.content
                })

        # Signal completion
        message_queue.put({'type': 'done'})

    except Exception as e:
        message_queue.put({
            'type': 'error',
            'content': str(e)
        })

@app.route('/poll/<poll_id>', methods=['GET'])
def poll(poll_id):
    if poll_id not in stream_queues:
        return jsonify({'error': 'Invalid poll ID'}), 404

    queue = stream_queues[poll_id]
    messages = []
    
    try:
        while not queue.empty():
            message = queue.get_nowait()
            if message['type'] == 'done':
                del stream_queues[poll_id]
                return jsonify({
                    'messages': messages,
                    'done': True
                })
            messages.append(message)
    except queue.Empty:
        pass
    
    return jsonify({
        'messages': messages,
        'done': False
    })

if __name__ == '__main__':
    app.run(debug=True)
