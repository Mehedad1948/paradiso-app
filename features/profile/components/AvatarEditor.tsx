"use client";
import { useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Tab, Tabs } from "@heroui/tabs";
import { MagnifierZoomInIcon, MagnifierZoomOutIcon, UndoLeftRoundIcon, UndoRightRoundIcon } from "@solar-icons/react/linear";
import { NEUTRAL, cssFilter, type Adjustments, type Area } from "../lib/avatar-image";
import { renderAvatar } from "../lib/render-avatar";
import { underlinedTabs } from "../tabs";
import RangeSlider from "./RangeSlider";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const adjustmentLabels: Record<keyof Adjustments, string> = {
  brightness: "Brightness",
  contrast: "Contrast",
  saturation: "Saturation",
};
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** Crop, rotate and tune a photo before it becomes an avatar. Resolves with a 512×512 JPEG. */
export default function AvatarEditor({
  source,
  onCancel,
  onApply,
}: {
  source: string;
  onCancel: () => void;
  onApply: (file: File) => void;
}) {
  const [tab, setTab] = useState<"crop" | "adjust">("crop");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustments>(NEUTRAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const edited =
    zoom !== MIN_ZOOM ||
    rotation !== 0 ||
    crop.x !== 0 ||
    crop.y !== 0 ||
    Object.values(adjustments).some(Boolean);

  const rotate = (by: number) => setRotation((current) => (current + by + 360) % 360);
  function resetAll() {
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setRotation(0);
    setAdjustments(NEUTRAL);
  }

  async function apply() {
    if (!area) return;
    setSaving(true);
    setError(null);
    try {
      onApply(await renderAvatar(source, area, rotation, adjustments));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The photo could not be edited.");
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      size="lg"
      placement="center"
      scrollBehavior="inside"
      onClose={onCancel}
      isDismissable={!saving}
      isKeyboardDismissDisabled={saving}
      hideCloseButton={saving}
    >
      <ModalContent className="border border-line bg-elevated text-ink">
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tracking-[-0.04em]">Edit photo</span>
          <span className="text-sm font-normal text-muted">
            Drag to reposition. Scroll or pinch to zoom.
          </span>
        </ModalHeader>
        <ModalBody className="gap-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#111] sm:aspect-[4/3]">
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              aspect={1}
              cropShape="round"
              showGrid={false}
              zoomSpeed={0.4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, pixels) => setArea(pixels)}
              style={{
                mediaStyle: { filter: cssFilter(adjustments) },
                cropAreaStyle: {
                  border: "1.5px solid rgb(255 255 255 / 85%)",
                  color: "rgb(10 10 10 / 62%)",
                },
              }}
            />
          </div>

          <div>
            <Tabs
              fullWidth
              variant="underlined"
              aria-label="Editing tools"
              selectedKey={tab}
              onSelectionChange={(key) => setTab(key as "crop" | "adjust")}
              isDisabled={saving}
              classNames={underlinedTabs}
            >
              <Tab key="crop" title="Crop" />
              <Tab key="adjust" title="Adjust" />
            </Tabs>

            {tab === "crop" ? (
              <div className="flex items-center gap-4 pt-5">
                <div className="min-w-0 flex-1">
                  <RangeSlider
                    label="Zoom"
                    value={zoom}
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    onChange={setZoom}
                    disabled={saving}
                    valueLabel={`${Math.round(zoom * 100)}%`}
                    start={<MagnifierZoomOutIcon size={17} aria-hidden="true" className="shrink-0" />}
                    end={<MagnifierZoomInIcon size={17} aria-hidden="true" className="shrink-0" />}
                  />
                </div>
                <div className="flex shrink-0 gap-1 border-l border-line pl-3">
                  <Button isIconOnly size="sm" variant="light" aria-label="Rotate left" onPress={() => rotate(-90)} isDisabled={saving}>
                    <UndoLeftRoundIcon size={17} aria-hidden="true" />
                  </Button>
                  <Button isIconOnly size="sm" variant="light" aria-label="Rotate right" onPress={() => rotate(90)} isDisabled={saving}>
                    <UndoRightRoundIcon size={17} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pt-5">
                {(Object.keys(adjustmentLabels) as (keyof Adjustments)[]).map((key) => (
                  <div key={key} className="grid grid-cols-[88px_1fr_36px] items-center gap-3">
                    <button
                      type="button"
                      className="text-left text-sm font-medium text-ink outline-none hover:text-accent focus-visible:text-accent disabled:pointer-events-none"
                      title="Reset"
                      disabled={saving || !adjustments[key]}
                      onClick={() => setAdjustments((current) => ({ ...current, [key]: 0 }))}
                    >
                      {adjustmentLabels[key]}
                    </button>
                    <RangeSlider
                      label={adjustmentLabels[key]}
                      value={adjustments[key]}
                      min={-100}
                      max={100}
                      origin={0}
                      onChange={(value) => setAdjustments((current) => ({ ...current, [key]: value }))}
                      disabled={saving}
                      valueLabel={signed(adjustments[key])}
                    />
                    <span className="text-right text-sm tabular-nums text-muted" aria-hidden="true">
                      {signed(adjustments[key])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger-500">
              {error}
            </p>
          )}
        </ModalBody>
        <ModalFooter className="mt-1 border-t border-line">
          <Button variant="light" className="mr-auto text-muted" onPress={resetAll} isDisabled={saving || !edited}>
            Reset
          </Button>
          <Button variant="light" onPress={onCancel} isDisabled={saving}>
            Cancel
          </Button>
          <Button
            className="bg-ink font-semibold text-canvas"
            onPress={() => void apply()}
            isLoading={saving}
            isDisabled={!area}
          >
            Apply
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
