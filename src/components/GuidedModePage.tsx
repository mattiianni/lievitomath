import { GuidedModeWizard } from './GuidedModeWizard';

interface Props {
  onClose: () => void;
}

export function GuidedModePage({ onClose }: Props) {
  return <GuidedModeWizard onClose={onClose} />;
}
