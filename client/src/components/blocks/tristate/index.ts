import { registerBlock, blockDefinitions } from '@/components/blocks/registry';
import { EditorPreview } from './EditorPreview';
import { ConfigPanel } from './ConfigPanel';

registerBlock({
  definition: blockDefinitions.tristate,
  EditorPreview,
  ConfigPanel,
});
