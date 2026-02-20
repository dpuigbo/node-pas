/**
 * Import this file to register all block types with the registry.
 * Each import triggers the block's index.ts which calls registerBlock().
 */

// Structure
import './header';
import './section_title';
import './divider';

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

// Media
import './image';
import './signature';
