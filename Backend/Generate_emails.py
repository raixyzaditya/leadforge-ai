import sys
import os
import json
from dotenv import load_dotenv
import anthropic

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("API"))
SYSTEM_MSG = """You write cold outreach emails that feel human and get replies.

Rules:
- Max 4 sentences in body
- First line must reference something specific about the prospect's company
- Naturally weave in what the product does and why it's relevant to them
- Never start with "I" or "My name is"
- Never say: hope this finds you well, reaching out, synergy, leverage
- End with a soft question not "Let me know if interested"
- Sound like a human founder not a sales rep
- Keep it short and punchy

Return JSON only, no extra text:
{
  "subject": "...",
  "body": "..."
}"""

def generate(name,company,content,product_name,product_description,product_goal,product_audience):
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        system=SYSTEM_MSG,
        messages=[{"role":"user","content": f"""
Prospect name: {name}
Prospect company: {company}
Prospect website content: {content[:2000]}

Product being pitched:
- Name: {product_name}
- What it does: {product_description}
- Primary goal: {product_goal}
- Target audience: {product_audience}

Write a personalized cold email pitching this product to this prospect.
The email should connect what the prospect's company does with why this product is relevant to them.
"""}]
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
       raw = raw.split("```")[1]
       if raw.startswith("json"):
          raw = raw[4:]
       raw = raw.strip()
    return json.loads(raw)

if __name__ == "__main__":
   raw_input = sys.stdin.read()
   data = json.loads(raw_input)

   result = generate(
        name=data.get("name", ""),
        company=data.get("company", ""),
        content=data.get("content", ""),
        product_name=data.get("product_name", ""),
        product_description=data.get("product_description", ""),
        product_goal=data.get("product_goal", ""),
        product_audience=data.get("product_audience", "")
    )
   print(json.dumps(result))