// These will be available from the sidebar
export const fields = [
  {
    type: "input",
    title: "Text Input"
  },
  {
    type: "select",
    title: "Select"
  },
  {
    type: "text",
    title: "Text"
  },
  {
    type: "button",
    title: "Button"
  },
  {
    type: "textarea",
    title: "Text Area"
  },
  {
    type: "label",
    title: "Label"
  },
  {
    type: "checkbox",
    title: "Checkbox"
  }
];

// These define how we render the field
export const renderers = {
  input: ({ name }) => <input type="text" placeholder={name} />,
  textarea: ({ name }) => <textarea rows="5" placeholder={name}></textarea>,
  select: ({ name }) => (
    <select>
      <option value="">{name}</option>
    </select>
  ),
  text: ({ name }) => <p>{name}</p>,
  button: ({ name }) => <button>{name}</button>,
  label: ({ name }) => <label>{name}</label>,
  checkbox: ({ name }) => (
    <>
      <input type="checkbox" id={name} />
      <label htmlFor={name}>{name}</label>
    </>
  ),
};
