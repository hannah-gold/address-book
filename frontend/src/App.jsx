import { useEffect, useState } from "react";


const API_URL = "http://localhost:8000";


const emptyContact = {
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: ""
};


function App() {

    const [contacts, setContacts] = useState([]);

    const [form, setForm] = useState(emptyContact);

    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState("");

    const [error, setError] = useState("");


    // -----------------------
    // Load contacts
    // -----------------------

    async function loadContacts() {

        try {

            const url = search
                ? `${API_URL}/contacts?search=${encodeURIComponent(search)}`
                : `${API_URL}/contacts`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Could not load contacts.");
            }

            const data = await response.json();

            setContacts(data);

        } catch (err) {

            setError(err.message);

        }

    }


    useEffect(() => {

        loadContacts();

    }, [search]);


    // -----------------------
    // Handle form changes
    // -----------------------

    function handleChange(event) {

        const { name, value } = event.target;

        setForm({
            ...form,
            [name]: value
        });

    }


    // -----------------------
    // Submit contact
    // -----------------------

    async function handleSubmit(event) {

        event.preventDefault();

        setError("");


        const method = editingId
            ? "PUT"
            : "POST";


        const url = editingId
            ? `${API_URL}/contacts/${editingId}`
            : `${API_URL}/contacts`;


        try {

            const response = await fetch(url, {

                method,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(form)

            });


            if (!response.ok) {

                const data = await response.json();

                throw new Error(
                    data.detail
                        ? "Please check the information you entered."
                        : "Unable to save contact."
                );

            }


            setForm(emptyContact);

            setEditingId(null);

            await loadContacts();


        } catch (err) {

            setError(err.message);

        }

    }


    // -----------------------
    // Edit
    // -----------------------

    function startEdit(contact) {

        setEditingId(contact.id);

        setForm({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            street: contact.street,
            city: contact.city,
            state: contact.state,
            zip: contact.zip
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // -----------------------
    // Cancel editing
    // -----------------------

    function cancelEdit() {

        setEditingId(null);

        setForm(emptyContact);

        setError("");

    }


    // -----------------------
    // Delete
    // -----------------------

    async function deleteContact(id) {

        const shouldDelete = window.confirm(
            "Are you sure you want to delete this contact?"
        );

        if (!shouldDelete) {
            return;
        }


        try {

            const response = await fetch(
                `${API_URL}/contacts/${id}`,
                {
                    method: "DELETE"
                }
            );


            if (!response.ok) {
                throw new Error("Unable to delete contact.");
            }


            if (editingId === id) {
                cancelEdit();
            }


            await loadContacts();


        } catch (err) {

            setError(err.message);

        }

    }


    // -----------------------
    // UI
    // -----------------------

    return (

        <main className="container">

            <header>

                <h1>Address Book</h1>

                <p>
                    Keep your contacts organized in one place.
                </p>

            </header>


            <section className="card">

                <h2>
                    {editingId
                        ? "Edit Contact"
                        : "Add Contact"}
                </h2>


                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}


                <form onSubmit={handleSubmit}>

                    <div className="form-grid">

                        <label>
                            Name

                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </label>


                        <label>
                            Email

                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </label>


                        <label>
                            Phone

                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="(310) 555-1234"
                                required
                            />
                        </label>


                        <label>
                            Street

                            <input
                                name="street"
                                value={form.street}
                                onChange={handleChange}
                                required
                            />
                        </label>


                        <label>
                            City

                            <input
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                required
                            />
                        </label>


                        <label>
                            State

                            <input
                                name="state"
                                value={form.state}
                                onChange={handleChange}
                                required
                            />
                        </label>


                        <label>
                            ZIP Code

                            <input
                                name="zip"
                                value={form.zip}
                                onChange={handleChange}
                                required
                            />
                        </label>

                    </div>


                    <div className="buttons">

                        <button type="submit">

                            {editingId
                                ? "Save Changes"
                                : "Add Contact"}

                        </button>


                        {editingId && (

                            <button
                                type="button"
                                className="secondary"
                                onClick={cancelEdit}
                            >
                                Cancel
                            </button>

                        )}

                    </div>

                </form>

            </section>


            <section className="contacts-section">

                <div className="contacts-header">

                    <h2>Contacts</h2>


                    <input
                        className="search"
                        placeholder="Search contacts..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />

                </div>


                {contacts.length === 0 ? (

                    <div className="empty">

                        No contacts found.

                    </div>

                ) : (

                    <div className="contact-list">

                        {contacts.map(contact => (

                            <article
                                className="contact-card"
                                key={contact.id}
                            >

                                <div>

                                    <h3>
                                        {contact.name}
                                    </h3>


                                    <p>
                                        <strong>Email:</strong>{" "}
                                        {contact.email}
                                    </p>


                                    <p>
                                        <strong>Phone:</strong>{" "}
                                        {contact.phone}
                                    </p>


                                    <p>
                                        <strong>Address:</strong>{" "}
                                        {contact.street},
                                        {" "}
                                        {contact.city},
                                        {" "}
                                        {contact.state}
                                        {" "}
                                        {contact.zip}
                                    </p>


                                    <small>
                                        Added{" "}
                                        {new Date(
                                            contact.created_at
                                        ).toLocaleString()}
                                    </small>

                                </div>


                                <div className="contact-actions">

                                    <button
                                        onClick={() =>
                                            startEdit(contact)
                                        }
                                    >
                                        Edit
                                    </button>


                                    <button
                                        className="delete"
                                        onClick={() =>
                                            deleteContact(contact.id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </main>

    );

}


export default App;