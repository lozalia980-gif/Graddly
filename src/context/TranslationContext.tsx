import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import translateWithMyMemory from "../services/translationService";

export type SupportedLanguage = "es" | "en" | "pt" | "zh";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "es",
  "en",
  "pt",
  "zh",
];

interface TranslationContextValue {
  language: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => void;
  /**
   * Traduce una cadena a `language` (idioma actual del contexto).
   * - Usa caché en memoria para evitar llamadas repetidas a MyMemory
   * - Deduplica llamadas concurrentes (in-flight)
   */
  translateText: (text: string) => Promise<string>;
  /**
   * Alias por compatibilidad con código existente.
   * @deprecated usa `translateText`
   */
  getTranslation: (text: string) => Promise<string>;
}

const TranslationContext = createContext<TranslationContextValue>({
  language: "es",
  changeLanguage: () => {},
  translateText: async (t: string) => t,
  getTranslation: async (t: string) => t,
});

function makeCacheKey(lang: SupportedLanguage, text: string) {
  return `${lang}::${text}`;
}

export const TranslationProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<SupportedLanguage>("es");

  // Caché en memoria: key = `${lang}::${text}` -> translated
  const cacheRef = useRef<Map<string, string>>(new Map());
  // Evita saturar por duplicados concurrentes: misma llave -> misma Promise
  const inflightRef = useRef<Map<string, Promise<string>>>(new Map());

  // Rate-limit súper simple (evita saturar MyMemory en listas grandes):
  // - limita concurrencia
  // - espera un pequeño delay entre requests
  const queueRef = useRef<
    {
      run: () => Promise<string>;
      resolve: (v: string) => void;
      reject: (e: unknown) => void;
    }[]
  >([]);
  const runningRef = useRef(0);
  const lastRequestAtRef = useRef(0);
  const MAX_CONCURRENCY = 2;
  const MIN_DELAY_MS = 140;

  const changeLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguage(lang);
  }, []);

  const scheduleTranslation = useCallback(async (fn: () => Promise<string>) => {
    return await new Promise<string>((resolve, reject) => {
      queueRef.current.push({ run: fn, resolve, reject });

      const pump = async (): Promise<void> => {
        if (runningRef.current >= MAX_CONCURRENCY) return;
        const next = queueRef.current.shift();
        if (!next) return;

        runningRef.current += 1;
        try {
          const now = Date.now();
          const delta = now - lastRequestAtRef.current;
          if (delta < MIN_DELAY_MS) {
            await new Promise((r) => setTimeout(r, MIN_DELAY_MS - delta));
          }
          lastRequestAtRef.current = Date.now();

          const result = await next.run();
          next.resolve(result);
        } catch (e) {
          next.reject(e);
        } finally {
          runningRef.current -= 1;
          // seguir procesando en cadena
          void pump();
        }
      };

      void pump();
    });
  }, []);

  const translateTextAsync = useCallback(
    async (text: string) => {
      const raw = String(text ?? "");
      if (!raw) return "";
      // Español es nuestro source; no traducimos para evitar requests inútiles
      if (language === "es") return raw;

      const key = makeCacheKey(language, raw);

      // 1) Caché
      if (cacheRef.current.has(key)) {
        // `get` puede devolver string vacío; por eso usamos `has`.
        return cacheRef.current.get(key) ?? raw;
      }

      // 2) In-flight dedupe
      const inflight = inflightRef.current.get(key);
      if (inflight) return await inflight;

      // 3) Programar request (rate limit + concurrencia)
      const promise = scheduleTranslation(async () => {
        const translated = await translateWithMyMemory(raw, language);
        return typeof translated === "string" && translated.trim()
          ? translated
          : raw;
      })
        .then((translated) => {
          cacheRef.current.set(key, translated);
          return translated;
        })
        .catch((err) => {
          // Importante: NO guardamos errores en caché.
          console.warn("translateTextAsync error", err);
          return raw;
        })
        .finally(() => {
          inflightRef.current.delete(key);
        });

      inflightRef.current.set(key, promise);
      return await promise;
    },
    [language, scheduleTranslation],
  );

  const value = useMemo<TranslationContextValue>(
    () => ({
      language,
      changeLanguage,
      translateText: translateTextAsync,
      getTranslation: translateTextAsync,
    }),
    [language, changeLanguage, translateTextAsync],
  );

  return (
    <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
  );
};

export const useTranslationContext = () => useContext(TranslationContext);
export default TranslationContext;
