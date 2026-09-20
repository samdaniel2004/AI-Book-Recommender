from huggingface_hub import InferenceClient

client = InferenceClient()

print("Testing Qwen LLM...")

response = client.chat.completions.create(
    model="Qwen/Qwen3-4B-Instruct-2507",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful AI book recommendation assistant."
        },
        {
            "role": "user",
            "content": "Recommend a science fiction book about artificial intelligence."
        }
    ],
    max_tokens=300
)

print("\n===== AI RESPONSE =====")
print(response.choices[0].message.content)