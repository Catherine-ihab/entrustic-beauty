/**
 * Removes the throwaway rows created while verifying the DTO-mapping fixes.
 * Matches the "+2010000000xx" test phone and the "خدمة اختبار" service name.
 * Usage: node scripts/run-api-script.cjs src/database/clean-test-rows.ts
 */
import { AppDataSource } from './data-source';

async function main() {
  await AppDataSource.initialize();
  try {
    const patients = await AppDataSource.query(
      `DELETE FROM patients WHERE phone LIKE '+2010000000%' RETURNING patient_number`,
    );
    const services = await AppDataSource.query(
      `DELETE FROM clinic_services WHERE name = 'خدمة اختبار' RETURNING name`,
    );
    console.log(`deleted test patients: ${patients.length}`);
    console.log(`deleted test services: ${services.length}`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
