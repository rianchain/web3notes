import React, { useEffect, useState } from 'react';
import { ethers, formatEther } from 'ethers';
import contractABI from './contract_abi.json';
import './App.css';

const LoadingOverlay = ({ message }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">{message || 'Processing transaction...'}</div>
    </div>
  );
};

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [contract, setContract] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState({ id: null, content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const CONTRACT_ADDRESS = '0x037D6f7aA2b55d0Ae80980D27107fF60a392b2dc';

  // Format address untuk display
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format timestamp ke tanggal yang readable
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Inisialisasi provider dan contract
  const initializeEthers = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        // Get balance
        const balance = await provider.getBalance(address);
        setBalance(formatEther(balance));

        // Initialize contract
        const notesContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
        setContract(notesContract);

        // Load notes
        loadNotes(notesContract);
      }
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    }
  };

  // Load semua notes
  const loadNotes = async (notesContract) => {
    try {
      setIsLoading(true);
      const allNotes = await notesContract.getAllNotes();
      const formattedNotes = allNotes.ids.map((id, index) => ({
        id: Number(id),
        content: allNotes.contents[index],
        createdAt: Number(allNotes.createdAts[index]),
        updatedAt: Number(allNotes.updatedAts[index]),
        isDeleted: allNotes.isDeleteds[index]
      }));
      setNotes(formattedNotes.filter(note => !note.isDeleted));
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new note
  const createNote = async () => {
    if (!newNote.trim()) return;
    try {
      setIsLoading(true);
      const tx = await contract.createNote(newNote);
      await tx.wait();
      setNewNote('');
      loadNotes(contract);
    } catch (err) {
      setError('Failed to create note');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update note
  const updateNote = async (id) => {
    try {
      setIsLoading(true);
      const tx = await contract.updateNote(id, editingNote.content);
      await tx.wait();
      setEditingNote({ id: null, content: '' });
      loadNotes(contract);
    } catch (err) {
      setError('Failed to update note');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete note
  const deleteNote = async (id) => {
    try {
      setIsLoading(true);
      const tx = await contract.deleteNote(id);
      await tx.wait();
      loadNotes(contract);
    } catch (err) {
      setError('Failed to delete note');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeEthers();
  }, []);

  return (
    <>
      {isLoading && <LoadingOverlay message="Processing transaction..." />}
      <div className="App">
        <div className="container">
          <header>
            <h1>Notes.io📑</h1>
            {walletAddress && (
              <div className="wallet-info">
                <p>Address: {formatAddress(walletAddress)}</p>
                <p>Balance: {balance ? `${Number(balance).toFixed(4)} ETH` : '...'}</p>
              </div>
            )}
          </header>

          {error && <div className="error-message">{error}</div>}

          <div className="notes-input">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here..."
              disabled={isLoading}
            />
            <button onClick={createNote} disabled={isLoading || !newNote.trim()}>
              Add Note
            </button>
          </div>

          <div className="notes-list">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                {editingNote.id === note.id ? (
                  <div className="edit-note">
                    <textarea
                      value={editingNote.content}
                      onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    />
                    <div className="edit-actions">
                      <button onClick={() => updateNote(note.id)}>Save</button>
                      <button onClick={() => setEditingNote({ id: null, content: '' })}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="note-content">{note.content}</p>
                    <div className="note-metadata">
                      <small>Created: {formatDate(note.createdAt)}</small>
                      <small>Updated: {formatDate(note.updatedAt)}</small>
                    </div>
                    <div className="note-actions">
                      <button onClick={() => setEditingNote({ id: note.id, content: note.content })}>
                        Edit
                      </button>
                      <button onClick={() => deleteNote(note.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
