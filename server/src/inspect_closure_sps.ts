import { executeRequest } from './utils/dbHandler';

async function main() {
  const sps = ['sp_cerrarCaja', 'sp_reporteCierreCaja'];
  try {
    for (const sp of sps) {
      const result = await executeRequest({
        query: `
          SELECT OBJECT_DEFINITION(OBJECT_ID('${sp}')) AS Definition
        `,
        isStoredProcedure: false
      });
      console.log(`\n=================== DEFINITION OF ${sp} ===================`);
      console.log(result.recordset[0]?.Definition || 'NOT FOUND');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
