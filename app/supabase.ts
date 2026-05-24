// Re-exporta el cliente desde lib/supabase (fuera de app/ para evitar que
// expo-router lo trate como una ruta y ejecute AsyncStorage en SSR de Node.js)
export { supabase } from "../lib/supabase";

