// 左侧设置面板：仅负责组装，各分组见 ./settings/*，原子控件见 ./fields
import type { CopybookConfig } from '../core/types';
import type { SetCfg } from './fields';
import TypeContentSettings from './settings/TypeContentSettings';
import LibrarySettings from './settings/LibrarySettings';
import AnnotationSettings from './settings/AnnotationSettings';
import GridStyleSettings from './settings/GridStyleSettings';
import FontColorSettings from './settings/FontColorSettings';
import PageSettings from './settings/PageSettings';

export default function SettingsPanel({ cfg, set }: { cfg: CopybookConfig; set: SetCfg }) {
  return (
    <div className="settings">
      <TypeContentSettings cfg={cfg} set={set} />
      <LibrarySettings cfg={cfg} set={set} />
      <AnnotationSettings cfg={cfg} set={set} />
      <GridStyleSettings cfg={cfg} set={set} />
      <FontColorSettings cfg={cfg} set={set} />
      <PageSettings cfg={cfg} set={set} />
    </div>
  );
}
