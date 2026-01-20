import supabase from "./SupabaseClient";

export async function testSupabaseConnection() {
  try {
    // Try to fetch a single row from any table
    const { data, error } = await supabase
      .from("sucursales") // Testing connection with sucursales table
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase connection error:", error.message);
      return false;
    }

    console.log("Supabase connection successful!");
    console.log("Test data:", data);
    return true;
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return false;
  }
}
