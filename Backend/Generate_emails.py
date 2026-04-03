import sys
import os
import json
from dotenv import load_dotenv
import anthropic

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_MSG = """You write warm, polite cold outreach emails that feel personal and get replies.

Rules:
- Start with a friendly greeting using the prospect's first name
- Second sentence must compliment something specific about their company
  based on the website content — show you actually looked at their business
- Third sentence introduce the product naturally by connecting their
  specific business challenge to what the product solves
- Fourth sentence show a clear benefit with a real number if possible
- End with a soft polite question inviting a conversation — not pushy
- Never say: hope this finds you well, synergy, leverage, circle back,
  touch base, reaching out, as per, kindly
- Sound like a thoughtful founder writing personally — not a sales rep
  blasting a list
- Tone: warm, respectful, confident but not arrogant
- Max 5 sentences total in the body
- Always end with a proper sign-off on a new line
- Don't use this "-" symbol in between the content 

Return JSON only, no extra text, no markdown:
{
  "subject": "...",
  "body": "..."
}"""


def generate(name, company, content, product_name, product_description,
             product_goal, product_audience, sender_name, sender_designation):

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        system=SYSTEM_MSG,
        messages=[{
            "role": "user",
            "content": f"""
Prospect name: {name}
Prospect company: {company}
What their company does (from website): {content[:2000]}

Product being pitched:
- Name: {product_name}
- What it does: {product_description}
- Primary goal: {product_goal}
- Target audience: {product_audience}

Sender details:
- Name: {sender_name}
- Designation: {sender_designation} at {product_name}

Write a warm, polite cold email from {sender_name} who is {sender_designation} of {product_name}.
The email should:
1. Greet {name} warmly by first name
2. Compliment something specific about {company} based on their website
3. Explain what {product_name} does and connect it to a real challenge {company} likely faces
4. Mention one specific benefit or result with a number if possible
5. End with a polite question asking if they would be open to a quick chat

Important: Only pitch this product if {company} is genuinely a good fit
based on their website. If they are in a completely unrelated industry,
still write the best possible email but make the connection honest and clear.

End the email with this exact sign-off on a new line:

Warm regards,
{sender_name}
{sender_designation}, {product_name}
"""
        }]
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
        product_audience=data.get("product_audience", ""),
        sender_name=data.get("sender_name", ""),
        sender_designation=data.get("sender_designation", ""),
    )

    print(json.dumps(result))