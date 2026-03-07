import sys
import os
import anthropic
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("API")
client = anthropic.Anthropic(api_key=api_key)
if len(sys.argv) < 2:
    print("No domain provided")
    sys.exit(1)
domain = sys.argv[1]


system_msg = """
You are responsible for getting the company website link, company name and linkedin from the domain provided.

Return strictly in this format:
website, name, linkedin

Example:
Input: ibm
Output:
https://www.ibm.com, IBM, https://www.linkedin.com/company/ibm
"""

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=300,
    system=system_msg,
    messages=[
        {"role": "user", "content": domain}
    ]
)
answer = response.content[0].text.strip()
print(answer)
