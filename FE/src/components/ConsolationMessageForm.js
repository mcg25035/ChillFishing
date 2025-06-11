import React, { useState, useEffect } from 'react';

const ConsolationMessageForm = ({ message, onSubmit, onCancel }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (message) {
      setText(message.message);
    } else {
      setText('');
    }
    setError('');
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Message cannot be empty.');
      return;
    }

    onSubmit({
      id: message ? message.id : null,
      message: text,
    });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{message ? 'Edit Consolation Message' : 'Add New Consolation Message'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="messageText">Message:</label>
            <textarea
              id="messageText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            ></textarea>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="submit">{message ? 'Update Message' : 'Add Message'}</button>
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsolationMessageForm;
