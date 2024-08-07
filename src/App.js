import { useRef, useState } from "react";
import { useImmer } from "use-immer";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Modal from "react-modal";
import Announcements from "./announcements";
import Canvas, { Field } from "./canvas";
import Sidebar, { SidebarField } from "./sidebar";

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
};

function getData(prop) {
  return prop?.data?.current ?? {};
}

function createSpacer({ id }) {
  return {
    id,
    type: "spacer",
    title: "spacer"
  };
}

export default function App() {
  const [sidebarFieldsRegenKey, setSidebarFieldsRegenKey] = useState(Date.now());
  const spacerInsertedRef = useRef();
  const currentDragFieldRef = useRef();
  const [activeSidebarField, setActiveSidebarField] = useState(); // only for fields from the sidebar
  const [activeField, setActiveField] = useState(); // only for fields that are in the form.
  const [data, updateData] = useImmer({ fields: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [fieldName, setFieldName] = useState("");

  const cleanUp = () => {
    setActiveSidebarField(null);
    setActiveField(null);
    currentDragFieldRef.current = null;
    spacerInsertedRef.current = false;
  };

  const handleDragStart = (e) => {
    const { active } = e;
    const activeData = getData(active);

    if (activeData.fromSidebar) {
      const { field } = activeData;
      const { type } = field;
      setActiveSidebarField(field);
      currentDragFieldRef.current = {
        id: active.id,
        type,
        name: `${type}${fields.length + 1}`,
        parent: null
      };
      return;
    }

    const { field, index } = activeData;
    setActiveField(field);
    currentDragFieldRef.current = field;
    updateData((draft) => {
      draft.fields.splice(index, 1, createSpacer({ id: active.id }));
    });
  };

  const handleDragOver = (e) => {
    const { active, over } = e;
    const activeData = getData(active);

    if (activeData.fromSidebar) {
      const overData = getData(over);

      if (!spacerInsertedRef.current) {
        const spacer = createSpacer({
          id: active.id + "-spacer"
        });

        updateData((draft) => {
          if (!draft.fields.length) {
            draft.fields.push(spacer);
          } else {
            const nextIndex =
              overData.index > -1 ? overData.index : draft.fields.length;

            draft.fields.splice(nextIndex, 0, spacer);
          }
          spacerInsertedRef.current = true;
        });
      } else if (!over) {
        updateData((draft) => {
          draft.fields = draft.fields.filter((f) => f.type !== "spacer");
        });
        spacerInsertedRef.current = false;
      } else {
        updateData((draft) => {
          const spacerIndex = draft.fields.findIndex(
            (f) => f.id === active.id + "-spacer"
          );

          const nextIndex =
            overData.index > -1 ? overData.index : draft.fields.length - 1;

          if (nextIndex === spacerIndex) {
            return;
          }

          draft.fields = arrayMove(draft.fields, spacerIndex, overData.index);
        });
      }
    }
  };

  const handleDragEnd = (e) => {
    const { over } = e;

    if (!over) {
      cleanUp();
      updateData((draft) => {
        draft.fields = draft.fields.filter((f) => f.type !== "spacer");
      });
      return;
    }

    let nextField = currentDragFieldRef.current;

    if (nextField) {
      const overData = getData(over);
      setCurrentField(nextField);
      setIsModalOpen(true);

      updateData((draft) => {
        const spacerIndex = draft.fields.findIndex((f) => f.type === "spacer");
        draft.fields.splice(spacerIndex, 1, nextField);

        draft.fields = arrayMove(
          draft.fields,
          spacerIndex,
          overData.index || 0
        );
      });
    }

    setSidebarFieldsRegenKey(Date.now());
    cleanUp();
  };

  const handleModalSubmit = () => {
    updateData((draft) => {
      const index = draft.fields.findIndex(f => f.id === currentField.id);
      if (index !== -1) {
        draft.fields[index].name = fieldName;
      }
    });
    setIsModalOpen(false);
    setFieldName("");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFieldName("");
  };

  const handlePreview = () => {
    const htmlContent = buildHTML(data.fields);
    const newWindow = window.open();
    newWindow.document.write(htmlContent);
  };

  const buildHTML = (fields) => {
    let html = `
      <html>
        <head>
          <title>Form Preview</title>
          <style>
            ${`
              .preview-content {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              
              .preview-content input,
              .preview-content select,
              .preview-content button {
                display: block;
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #ccc;
                font-size: 16px;
              }
              .preview-content textarea {
                display: block;
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #ccc;
              }
              .preview-content input:focus,
              .preview-content select:focus,
              .preview-content button:hover {
                border-color: #007bff;
                outline: none;
              }
              
              .preview-content select {
                width: 100%;
              }
              
              .preview-content button {
                background-color: #007bff;
                color: white;
                border: none;
                cursor: pointer;
                text-align: center;
                font-size: 16px;
              }
              
              .preview-content button:hover {
                background-color: #0056b3;
              }
            `}
          </style>
        </head>
        <body class="preview-content">
    `;

    fields.forEach((field) => {
      if (field.type === 'input') {
        html += `<input placeholder="${field.name}" /><br/>`;
      } else if (field.type === 'select') {
        html += `<select><option>${field.name}</option></select><br/>`;
      } else if (field.type === 'button') {
        html += `<button>${field.name}</button><br/>`;
      } else if (field.type === 'textarea') {
        html += `<textarea placeholder="${field.name}"></textarea><br/>`;
      } else if (field.type === 'label') {
        html += `<label>${field.name}</label><br/>`;
      } else if (field.type === 'checkbox') {
        html += `<input type="checkbox" id="${field.name}" name="${field.name}" value="${field.name}">
        <label for="${field.name}">${field.name}</label><br/>`;
      } else if (field.type === 'text') {
        html += `<p>${field.name}</p><br/>`;
      }
    });

    html += '</body></html>';
    return html;
  };

  const { fields } = data;

  return (
    <div className="app">
      <div className="content">
        <div className="header">
          <button className="preview-button" onClick={handlePreview}>Preview</button>
        </div>
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll
        >
          <Announcements />
          <Sidebar fieldsRegKey={sidebarFieldsRegenKey} />
          <SortableContext
            strategy={verticalListSortingStrategy}
            items={fields.map((f) => f.id)}
          >
            <Canvas fields={data.fields} />
          </SortableContext>
          <DragOverlay dropAnimation={false}>
            {activeSidebarField ? (
              <SidebarField field={activeSidebarField} overlay />
            ) : activeField ? (
              <Field field={activeField} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={handleModalClose}
          contentLabel="Field Name Modal"
          style={customStyles}
        >
          <h2>Enter Name for Your {currentField?.type}</h2>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Field Name"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '20px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
          <button onClick={handleModalSubmit} style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
          }}>Submit</button>
        </Modal>
      </div>
    </div>
  );
}
