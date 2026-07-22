export function PanelPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex-1 border border-dashed border-gray-700 flex items-center justify-center text-gray-500 rounded-sm">
      {text}
    </div>
  );
}
