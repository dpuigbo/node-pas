import { registerBlock, blockDefinitions } from '@/components/blocks/registry';
import { EditorPreview } from './EditorPreview';
import { ConfigPanel } from './ConfigPanel';
import { FormField } from './FormField';

registerBlock({
  definition: blockDefinitions.select_field,
  EditorPreview,
  ConfigPanel,
  FormField,
});
