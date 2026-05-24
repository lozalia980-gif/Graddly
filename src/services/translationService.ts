export async function translateText(
  text: string,
  targetLanguage: string,
): Promise<string> {
  try {
    const email = "tu-correo@email.com";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text,
    )}&langpair=es|${targetLanguage}&de=${encodeURIComponent(email)}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    return typeof translated === "string" ? translated : text;
  } catch (err) {
    console.warn("translateText error", err);
    return text;
  }
}

export default translateText;
