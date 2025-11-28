import React, { useState, useEffect } from 'react';
import './App.css';
import {
  getGroups,
  saveGroups,
  getNotes,
  saveNotes,
  getSelectedGroup,
  setSelectedGroup,
} from './utils/storage';

function App() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroupState] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#f06292');
  const [selectedNote, setSelectedNote] = useState(null);
  const [editContent, setEditContent] = useState('');
// 🔥 Reset storage ONCE to remove old groups
useEffect(() => {
  const alreadyReset = localStorage.getItem("storage-reset");

  if (!alreadyReset) {
    localStorage.removeItem("note-groups");
    localStorage.removeItem("selected-group");

    // Remove all notes-* keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("notes-")) {
        localStorage.removeItem(key);
      }
    });

    localStorage.removeItem("group-color-map");

    // Mark that reset is already done
    localStorage.setItem("storage-reset", "true");
  }
}, []);

  // Load groups on page load
  useEffect(() => {
    const savedGroups = getGroups();
    setGroups(savedGroups);
  }, []);

  // Load notes when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      setSelectedGroup(selectedGroup);
      const savedNotes = getNotes(selectedGroup);
      setNotes(savedNotes);
    }
  }, [selectedGroup]);

  // Create new group
  const handleAddGroup = () => {
    if (newGroupName.length < 2 || groups.includes(newGroupName)) return;

    const updatedGroups = [...groups, newGroupName];
    setGroups(updatedGroups);
    saveGroups(updatedGroups);

    const colorMap = JSON.parse(localStorage.getItem('group-color-map') || '{}');
    colorMap[newGroupName] = selectedColor;
    localStorage.setItem('group-color-map', JSON.stringify(colorMap));

    setNewGroupName('');
    setSelectedColor('#f06292');
    setShowPopup(false);
  };

  // Save note
  const handleNoteSave = () => {
    if (!newNote.trim()) return;

    const now = new Date();
    const newNoteObj = {
      id: Date.now(),
      content: newNote,
      createdAt: now.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      updatedAt: now.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
    };

    const updatedNotes = [...notes, newNoteObj];
    setNotes(updatedNotes);
    saveNotes(selectedGroup, updatedNotes);
    setNewNote('');
  };

  // Delete note
  const handleDeleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    saveNotes(selectedGroup, updatedNotes);
  };

  // Update note (FUNC2)
  const handleUpdateNote = () => {
    if (!editContent.trim()) return;

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id
        ? {
            ...note,
            content: editContent,
            updatedAt: new Date().toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }),
          }
        : note
    );

    setNotes(updatedNotes);
    saveNotes(selectedGroup, updatedNotes);
    setSelectedNote(null);
  };

  // Color functions
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 70%)`;
  }

  function getGroupColor(group) {
    const colorMap = JSON.parse(localStorage.getItem('group-color-map') || '{}');
    return colorMap[group] || stringToColor(group);
  }

  return (
    <div className="app">

      {/* ---------------- SIDEBAR ---------------- */}
      <div className="sidebar">
        <h2 className="sidebar-title">Pocket Notes</h2>

        <ul>
          {groups.map((group, i) => (
            <li
              key={i}
              className={group === selectedGroup ? 'active' : ''}
              onClick={() => setSelectedGroupState(group)}
            >
              <span
                className="avatar"
                style={{ backgroundColor: getGroupColor(group) }}
              >
                {group.slice(0, 2).toUpperCase()}
              </span>
              {group}
            </li>
          ))}
        </ul>

        <button onClick={() => setShowPopup(true)}>+</button>
      </div>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <div className="main">

        {/* ------------------- WELCOME PAGE LOGIC ------------------- */}
        {groups.length === 0 || !selectedGroup ? (
  <>
    <div className="placeholder">
      <img src={`${process.env.PUBLIC_URL}/welcome.png`} alt="Welcome" />
      <h1>Pocket Notes</h1>
      <p>Send and receive messages without keeping your phone online.</p>
      <p>Use Pocket Notes on up to 4 linked devices and 1 mobile phone.</p>
    </div>

    {/* Lock text fixed at bottom */}
    <div className="encryption-note">🔒 end-to-end encrypted</div>
  </>
) : (

          <>
            {/* ---------------- GROUP HEADER ---------------- */}
            <div className="top-bar">
              <div className="group-header">
                <div
                  className="group-avatar"
                  style={{ backgroundColor: getGroupColor(selectedGroup) }}
                >
                  {selectedGroup.slice(0, 2).toUpperCase()}
                </div>
                <h2>{selectedGroup}</h2>
              </div>
            </div>

            {/* ---------------- NOTES LIST ---------------- */}
            <div className="notes-display">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="note"
                  onClick={() => {
                    setSelectedNote(note);
                    setEditContent(note.content);
                  }}
                >
                  <p>{note.content}</p>
                  <div className="timestamps">{note.createdAt}</div>
                </div>
              ))}
            </div>

            {/* ---------------- NOTE INPUT BOX ---------------- */}
            <div className="note-input">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your text here"
                className="note-textbox"
              />
              <button className={newNote ? 'active' : ''} onClick={handleNoteSave}>➤</button>
            </div>
          </>
        )}
      </div>

      {/* ---------------- NOTE DETAIL POPUP (FUNC2) ---------------- */}
      {selectedNote && (
        <div className="note-detail-overlay" onClick={() => setSelectedNote(null)}>
          <div className="note-detail" onClick={e => e.stopPropagation()}>
            <h3>Note Detail</h3>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows="5"
            />
            <div className="timestamps">
              <small>Created: {selectedNote.createdAt}</small><br />
              <small>Last Updated: {selectedNote.updatedAt}</small>
            </div>
            <div style={{ marginTop: '10px' }}>
              <button onClick={handleUpdateNote}>Save Changes</button>
              <button onClick={() => setSelectedNote(null)} style={{ marginLeft: '10px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CREATE GROUP POPUP ---------------- */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup" onClick={e => e.stopPropagation()}>
            <h3>Create New Group</h3>

            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
              <label
                style={{
                  marginRight: '10px',
                  minWidth: '100px',
                  fontWeight: '500',
                  paddingTop: '10px'
                }}
              >
                Group Name
              </label>

              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>

            <div className="color-row">
              <label>Choose colour</label>
              <div className="color-options">
                {['#f06292', '#ba68c8', '#64b5f6', '#4db6ac', '#ffd54f'].map((color) => (
                  <span
                    key={color}
                    className="color-dot"
                    style={{
                      backgroundColor: color,
                      border: selectedColor === color ? '2px solid black' : '1px solid gray'
                    }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <button onClick={handleAddGroup} disabled={newGroupName.length < 2}>
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
