from flask import Flask, render_template, request, jsonify
import time
from openai import OpenAI
import os

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)

@app.route('/')
def home():
    # This could come from your database or other data source
    example_data = {
        'po_number': '2347183-2587D',
        'part_numbers': ['2347183', '2587D'],
    }
    return render_template('index.html', examples=example_data)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Create chat completion with GPT-4
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # You can change this to other models like "gpt-3.5-turbo"
            messages=[
                {"role": "system", "content": """You are a helpful AI assistant for the procurement team. You are trained on emails from hodleremail@outlook.com. CC this address in your emails to include them in the AI's knowledge base.""
                 Always provide your responses formatted in Markdown. 
                Use the following guidelines:
                - Use ### to ###### for headings.
                - Use * or _ for italics, and ** or __ for bold.
                - Use - or * for unordered lists, and 1. for ordered lists.
                - Use \` for inline code and \`\`\` for code blocks, specifying the language (e.g., \`\`\`javascript).
                - Use > for blockquotes.
                - Ensure all Markdown is well-formed and properly structured."""},
                {"role": "user", "content": user_message}
            ]
        )

        # Extract the assistant's response
        assistant_response = response.choices[0].message.content

        return jsonify({'response': assistant_response})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
