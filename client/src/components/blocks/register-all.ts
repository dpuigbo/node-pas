/**
 * Import this file to register all block types with the registry.
 * Each import triggers the block's index.ts which calls registerBlock().
 */

// Structure
import './header';
import './section_title';
import './divider';
import './table_of_contents';

// Data fields
import './text_field';
import './number_field';
import './date_field';
import './text_area';
import './select_field';

// Inspection
import './tristate';
import './checklist';
import './table';
import './equipment_exchange';
import './reducer_oils';
import './battery_manipulator';
import './battery_controller';

// Media
import './image';
import './signature';

// Document template sections (not in palette — auto-inserted)
import './section_separator';

// Component template sections
import './component_section';

// Document template blocks
import './cover_header';
import './page_header';
import './page_footer';
import './back_cover';
import './page_break';
import './content_placeholder';
import './intervention_data';
import './client_data';
