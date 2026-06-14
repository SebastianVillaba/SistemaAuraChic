import { executeRequest } from "./utils/dbHandler";

async function main() {
  try {
    console.log("Checking sp_crearUsuario definition...");
    const def1 = await executeRequest({
      query: "SELECT OBJECT_DEFINITION(OBJECT_ID('sp_crearUsuario')) AS definition;",
      isStoredProcedure: false
    });
    console.log(def1.recordset[0]?.definition);

    console.log("\nChecking sp_modificarUsuario definition...");
    const def2 = await executeRequest({
      query: "SELECT OBJECT_DEFINITION(OBJECT_ID('sp_modificarUsuario')) AS definition;",
      isStoredProcedure: false
    });
    console.log(def2.recordset[0]?.definition);
  } catch (error) {
    console.error("Error inspecting database:", error);
  }
  process.exit(0);
}

main();
