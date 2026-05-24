import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { Text, TextProps } from "react-native";
import { useTranslationContext } from "../src/context/TranslationContext";

interface Props extends TextProps {
  /**
   * IMPORTANTE:
   * Este componente está pensado para traducir texto "humano" (estático o de DB)
   * usando el caché del TranslationContext.
   */
  children: ReactNode;
}

function flattenTextSegments(children: ReactNode): Array<string | ReactNode> {
  const segments: Array<string | ReactNode> = [];
  let currentText = "";

  React.Children.toArray(children).forEach((child) => {
    if (typeof child === "string" || typeof child === "number") {
      currentText += String(child);
      return;
    }

    if (currentText) {
      segments.push(currentText);
      currentText = "";
    }
    segments.push(child);
  });

  if (currentText) segments.push(currentText);
  return segments;
}

export default function TranslatedText({ children, style, ...rest }: Props) {
  const { language, translateText } = useTranslationContext();
  const [translated, setTranslated] = useState<ReactNode>(children);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const requestId = (requestIdRef.current += 1);

    // Regla clave: nunca mostrar "parpadeo" en blanco ni "Loading...".
    // Siempre mostramos el texto original mientras se resuelve la traducción.
    setTranslated(children);

    const segments = flattenTextSegments(children);
    const textSegments = segments.filter(
      (segment): segment is string => typeof segment === "string",
    );

    if (textSegments.length === 0) {
      return () => {
        mounted = false;
      };
    }

    void (async () => {
      const translatedPieces = await Promise.all(
        textSegments.map((segment) => translateText(segment)),
      );
      if (!mounted) return;
      // Evita que una promesa vieja pise el estado si `children` cambió rápido
      if (requestId !== requestIdRef.current) return;

      let textIndex = 0;
      const reconstructed = segments.map((segment) =>
        typeof segment === "string"
          ? (translatedPieces[textIndex++] ?? segment)
          : segment,
      );

      setTranslated(reconstructed.length === 1 ? reconstructed[0] : reconstructed);
    })().catch(() => {
      // Si falla, nos quedamos con el original (ya está seteado arriba)
    });

    return () => {
      mounted = false;
    };
  }, [children, language, translateText]);

  return (
    <Text style={style} {...rest}>
      {translated}
    </Text>
  );
}
