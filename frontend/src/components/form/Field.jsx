import SegmentedControl from './SegmentedControl';
import SelectControl from './SelectControl';
import ScaleControl from './ScaleControl';
import BandControl from './BandControl';
import GradeScaleControl from './GradeScaleControl';
import NumberStepper from './NumberStepper';

// Renders one question: a label, an optional "optional" tag, the control that
// suits the field type, and an inline error when the step tries to advance with
// a required answer still missing.
export default function Field({ field, value, onChange, invalid }) {
  const { name, label, type, optional, help } = field;

  return (
    <div>
      <div className="mb-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={name} className="text-sm font-medium text-ink-800">
            {label}
          </label>
          {optional && <span className="text-xs text-ink-400">Optional</span>}
        </div>
        {help && <p className="mt-1 text-xs leading-relaxed text-ink-400">{help}</p>}
      </div>

      {type === 'segmented' && (
        <SegmentedControl
          name={name}
          value={value}
          onChange={onChange}
          options={field.options}
          invalid={invalid}
        />
      )}

      {type === 'select' && (
        <SelectControl
          name={name}
          value={value}
          onChange={onChange}
          options={field.options}
          invalid={invalid}
        />
      )}

      {type === 'scale' && (
        <ScaleControl
          name={name}
          value={value}
          onChange={onChange}
          min={field.min}
          max={field.max}
          labels={field.scaleLabels}
        />
      )}

      {type === 'bands' && (
        <BandControl name={name} value={value} onChange={onChange} options={field.options} />
      )}

      {type === 'grade' && (
        <GradeScaleControl
          name={name}
          value={value}
          onChange={onChange}
          scales={field.scales}
          options={field.options}
        />
      )}

      {type === 'number' && (
        <NumberStepper
          name={name}
          value={value}
          onChange={onChange}
          min={field.min}
          max={field.max}
        />
      )}

      {invalid && <p className="mt-1.5 text-xs text-risk-high">Please choose an option to continue.</p>}
    </div>
  );
}
