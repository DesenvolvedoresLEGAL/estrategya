-- Rename last_updated_at to updated_at in wizard_progress table
ALTER TABLE wizard_progress 
RENAME COLUMN last_updated_at TO updated_at;

-- Ensure the trigger is properly configured
DROP TRIGGER IF EXISTS handle_wizard_progress_updated_at ON wizard_progress;

CREATE TRIGGER handle_wizard_progress_updated_at
  BEFORE UPDATE ON wizard_progress
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();