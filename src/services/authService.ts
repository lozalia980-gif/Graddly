import { Alert } from "react-native";
import { supabase } from "../../lib/supabase";

export async function handleLogout(
  router: { replace: (p: string) => void } | any,
) {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", error.message ?? "No se pudo cerrar sesión.");
      return;
    }
    // Redirect to login screen
    try {
      router.replace("/iniciosesion");
    } catch (err) {
      // ignore
    }
  } catch (err: any) {
    Alert.alert("Error", err?.message ?? "No se pudo cerrar sesión.");
  }
}

export async function updateEmpresaPlan(
  payload: Record<string, string | undefined>,
) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      throw new Error(
        userError?.message || "No se encontró el usuario autenticado.",
      );
    }

    const { error } = await supabase
      .from("empresas")
      .update(payload)
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (err: any) {
    console.error("updateEmpresaPlan error", err);
    throw new Error(
      err?.message || "Error actualizando el plan de la empresa.",
    );
  }
}

export default handleLogout;
