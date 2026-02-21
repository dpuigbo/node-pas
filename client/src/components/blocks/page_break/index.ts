import { registerBlock, blockDefinitions } from '@/components/blocks/registry';
import { EditorPreview } from './EditorPreview';
import { ConfigPanel } from './ConfigPanel';

registerBlock({
  definition: blockDefinitions.page_break,
  EditorPreview,
  ConfigPanel,
});
