import { registerBlock, blockDefinitions } from '@/components/blocks/registry';
import { EditorPreview } from './EditorPreview';
import { ConfigPanel } from './ConfigPanel';
import { FormField } from './FormField';

registerBlock({
  definition: blockDefinitions.intervention_data,
  EditorPreview,
  ConfigPanel,
  FormField,
});
