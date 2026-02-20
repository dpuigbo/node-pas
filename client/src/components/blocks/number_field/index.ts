import { registerBlock, blockDefinitions } from '@/components/blocks/registry';
import { EditorPreview } from './EditorPreview';
import { ConfigPanel } from './ConfigPanel';

registerBlock({
  definition: blockDefinitions.number_field,
  EditorPreview,
  ConfigPanel,
});
