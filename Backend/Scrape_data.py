import requests
from bs4 import BeautifulSoup
import trafilatura
from urllib.parse import urljoin, urlparse
import tldextract

headers = {
    "User-Agent": "Mozilla/5.0"
}

visited = set()
MAX_PAGES = 10


def is_internal(base_domain, url):
    extracted = tldextract.extract(url)
    return extracted.domain == base_domain


def get_links(url, base_domain):
    links = []

    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")

        for a in soup.find_all("a", href=True):

            link = urljoin(url, a["href"])

            if is_internal(base_domain, link):
                links.append(link)

    except:
        pass

    return links


def scrape_page(url):

    downloaded = trafilatura.fetch_url(url)

    if not downloaded:
        return ""

    text = trafilatura.extract(downloaded)

    if not text:
        return ""

    return text


def crawl_website(start_url):

    base_domain = tldextract.extract(start_url).domain

    queue = [start_url]

    all_text = ""

    while queue and len(visited) < MAX_PAGES:

        url = queue.pop(0)

        if url in visited:
            continue

        print("Scraping:", url)

        visited.add(url)

        text = scrape_page(url)

        all_text += text + "\n"

        links = get_links(url, base_domain)

        for link in links:
            if link not in visited:
                queue.append(link)

    return all_text


if __name__ == "__main__":

    website = "https://technova.com"

    content = crawl_website(website)

    print("\n\nFINAL EXTRACTED TEXT:\n")

    print(content[:5000])