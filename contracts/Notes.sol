// this contract own by @rianchain
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Notes {
    // fondasi kerangka fitur catatan
    struct Note {
        uint256 id;
        string content;
        uint256 createdAt;
        uint256 updatedAt;
        bool isDeleted;
    }

    // Mapping dari address ke array of notes
    mapping(address => Note[]) private userNotes;
    // Mapping untuk tracking jumlah notes per user
    mapping(address => uint256) private userNotesCount;

    // Events
    event NoteCreated(address indexed owner, uint256 indexed noteId, string content, uint256 timestamp);
    event NoteUpdated(address indexed owner, uint256 indexed noteId, string newContent, uint256 timestamp);
    event NoteDeleted(address indexed owner, uint256 indexed noteId, uint256 timestamp);

    // Modifier untuk memastikan note exists dan dimiliki oleh sender
    modifier onlyNoteOwner(uint256 _noteId) {
        require(_noteId < userNotes[msg.sender].length, "Catatan tidak ada!");
        require(!userNotes[msg.sender][_noteId].isDeleted, "Catatan telah di hapus.");
        _;
    }

    // Fungsi untuk membuat catatan baru
    function createNote(string memory _content) public returns (uint256) {
        uint256 noteId = userNotesCount[msg.sender];
        
        Note memory newNote = Note({
            id: noteId,
            content: _content,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isDeleted: false
        });

        userNotes[msg.sender].push(newNote);
        userNotesCount[msg.sender]++;

        emit NoteCreated(msg.sender, noteId, _content, block.timestamp);
        return noteId;
    }

    // Fungsi untuk mengupdate catatan
    function updateNote(uint256 _noteId, string memory _newContent) 
        public 
        onlyNoteOwner(_noteId) 
    {
        Note storage note = userNotes[msg.sender][_noteId];
        note.content = _newContent;
        note.updatedAt = block.timestamp;

        emit NoteUpdated(msg.sender, _noteId, _newContent, block.timestamp);
    }

    // Fungsi untuk menghapus catatan (soft delete)
    function deleteNote(uint256 _noteId) 
        public 
        onlyNoteOwner(_noteId) 
    {
        Note storage note = userNotes[msg.sender][_noteId];
        note.isDeleted = true;
        note.updatedAt = block.timestamp;

        emit NoteDeleted(msg.sender, _noteId, block.timestamp);
    }

    // Fungsi untuk mendapatkan satu catatan
    function getNote(uint256 _noteId) 
        public 
        view 
        returns (
            string memory content,
            uint256 createdAt,
            uint256 updatedAt,
            bool isDeleted
        ) 
    {
        require(_noteId < userNotes[msg.sender].length, "Catatan tidak ada!");
        Note memory note = userNotes[msg.sender][_noteId];
        return (
            note.content,
            note.createdAt,
            note.updatedAt,
            note.isDeleted
        );
    }

    // Fungsi untuk mendapatkan semua catatan user
    function getAllNotes() 
        public 
        view 
        returns (
            uint256[] memory ids,
            string[] memory contents,
            uint256[] memory createdAts,
            uint256[] memory updatedAts,
            bool[] memory isDeleteds
        ) 
    {
        uint256 totalNotes = userNotesCount[msg.sender];
        
        ids = new uint256[](totalNotes);
        contents = new string[](totalNotes);
        createdAts = new uint256[](totalNotes);
        updatedAts = new uint256[](totalNotes);
        isDeleteds = new bool[](totalNotes);

        for (uint256 i = 0; i < totalNotes; i++) {
            Note memory note = userNotes[msg.sender][i];
            ids[i] = note.id;
            contents[i] = note.content;
            createdAts[i] = note.createdAt;
            updatedAts[i] = note.updatedAt;
            isDeleteds[i] = note.isDeleted;
        }

        return (ids, contents, createdAts, updatedAts, isDeleteds);
    }

    // Fungsi untuk mendapatkan jumlah catatan user
    function getNotesCount() public view returns (uint256) {
        return userNotesCount[msg.sender];
    }
}
