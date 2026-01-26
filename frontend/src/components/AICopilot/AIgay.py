import requests

def response_gen_ai(message):
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "SimpleGenAI"
    }

    payload = {
        "model": "mistralai/devstral-2512:free",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful AI assistant. Answer clearly and directly."
            },
            {
                "role": "user",
                "content": message
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        print("HTTP ERROR:", response.status_code)
        print(response.text)
        return

    data = response.json()

    if "choices" not in data:
        print("API ERROR:", data)
        return

    answer = data["choices"][0]["message"]["content"]
    print("\nGenAI:", answer)
    print("-" * 40)


def main():
    print("🤖 GenAI Chat – type 'exit' to quit")
    while True:
        message = input("\nYou: ")
        if message.lower() == "exit":
            break
        response_gen_ai(message)


main()
