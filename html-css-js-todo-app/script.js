document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const itemsLeftSpan = document.getElementById('items-left');

    // --- Global State ---
    let todos = []; // Array of todo objects: { id: Date.now(), text: '...', completed: false }
    let currentFilter = 'all';

    // --- Utility Functions ---
    /**
     * Generates a unique ID for a new todo item.
     * @returns {number} A unique timestamp ID.
     */
    const generateId = () => Date.now();

    /**
     * Saves the current todos array to local storage.
     */
    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    /**
     * Loads todos from local storage.
     */
    const loadTodos = () => {
        const storedTodos = localStorage.getItem('todos');
        if (storedTodos) {
            todos = JSON.parse(storedTodos);
        }
    };

    /**
     * Updates the count of active (uncompleted) todo items.
     */
    const updateItemsLeft = () => {
        const activeTodosCount = todos.filter(todo => !todo.completed).length;
        itemsLeftSpan.textContent = `${activeTodosCount} items left`;
    };

    // --- Render Function ---
    /**
     * Renders the todo list based on the current filter.
     */
    const renderTodos = () => {
        todoList.innerHTML = ''; // Clear existing list items

        // Filter todos based on currentFilter
        const filteredTodos = todos.filter(todo => {
            if (currentFilter === 'active') {
                return !todo.completed;
            }
            if (currentFilter === 'completed') {
                return todo.completed;
            }
            return true; // 'all' filter
        });

        if (filteredTodos.length === 0 && todos.length > 0) {
            // Display a message if no todos match the filter but there are todos overall
            const noMatchMsg = document.createElement('li');
            noMatchMsg.textContent = `No ${currentFilter} tasks.`;
            noMatchMsg.style.textAlign = 'center';
            noMatchMsg.style.padding = '15px';
            noMatchMsg.style.color = '#777';
            todoList.appendChild(noMatchMsg);
            updateItemsLeft();
            return; // Exit render if no items to display
        } else if (todos.length === 0) {
            // Display message if there are no todos at all
            const noTodosMsg = document.createElement('li');
            noTodosMsg.textContent = 'No tasks yet. Add one above!';
            noTodosMsg.style.textAlign = 'center';
            noTodosMsg.style.padding = '15px';
            noTodosMsg.style.color = '#777';
            todoList.appendChild(noTodosMsg);
            updateItemsLeft();
            return;
        }

        // Create and append list items for each todo
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', todo.id);

            li.innerHTML = `
                <div class="todo-item-left">
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="todo-text">${todo.text}</span>
                </div>
                <div class="todo-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            todoList.appendChild(li);
        });
        updateItemsLeft();
    };

    // --- Event Handlers ---

    /**
     * Adds a new todo item to the list.
     */
    const addTodo = () => {
        const text = todoInput.value.trim();

        // Input validation
        if (text === '') {
            alert('Please enter a task!');
            return;
        }

        const newTodo = {
            id: generateId(),
            text: text,
            completed: false
        };
        todos.push(newTodo);
        saveTodos();
        todoInput.value = ''; // Clear input field
        renderTodos();
    };

    /**
     * Toggles the completion status of a todo item.
     * @param {number} id - The ID of the todo to toggle.
     */
    const toggleTodoCompletion = (id) => {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos();
        renderTodos();
    };

    /**
     * Deletes a todo item from the list.
     * @param {number} id - The ID of the todo to delete.
     */
    const deleteTodo = (id) => {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    };

    /**
     * Initiates editing for a todo item, converting its text into an input field.
     * @param {HTMLLIElement} liElement - The list item element being edited.
     */
    const editTodo = (liElement) => {
        const todoTextSpan = liElement.querySelector('.todo-text');
        const editButton = liElement.querySelector('.edit-btn');

        // If already in editing mode, do nothing
        if (todoTextSpan.classList.contains('editing')) {
            return;
        }

        const originalText = todoTextSpan.textContent;
        todoTextSpan.contentEditable = true;
        todoTextSpan.focus();
        todoTextSpan.classList.add('editing');

        // Change edit button to save button
        editButton.innerHTML = '<i class="fas fa-save"></i>';
        editButton.classList.remove('edit-btn');
        editButton.classList.add('save-btn');

        // Place cursor at the end of the text
        const range = document.createRange();
        range.selectNodeContents(todoTextSpan);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Event listener for blur (losing focus) to save changes
        const handleBlur = () => {
            const newText = todoTextSpan.textContent.trim();
            if (newText === '') {
                alert('Task cannot be empty! Reverting to original text.');
                todoTextSpan.textContent = originalText;
            } else {
                const id = parseInt(liElement.getAttribute('data-id'));
                todos = todos.map(todo =>
                    todo.id === id ? { ...todo, text: newText } : todo
                );
                saveTodos();
            }
            todoTextSpan.contentEditable = false;
            todoTextSpan.classList.remove('editing');
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.classList.remove('save-btn');
            editButton.classList.add('edit-btn');
            todoTextSpan.removeEventListener('blur', handleBlur);
            todoTextSpan.removeEventListener('keydown', handleKeydown);
        };

        // Event listener for 'Enter' key to save changes
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent new line
                todoTextSpan.blur(); // Trigger blur to save
            }
        };

        todoTextSpan.addEventListener('blur', handleBlur);
        todoTextSpan.addEventListener('keydown', handleKeydown);
    };

    /**
     * Clears all completed todo items.
     */
    const clearCompletedTodos = () => {
        if (!confirm('Are you sure you want to clear all completed tasks?')) {
            return;
        }
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
    };

    /**
     * Sets the active filter and re-renders todos.
     * @param {string} filterType - 'all', 'active', or 'completed'.
     */
    const setFilter = (filterType) => {
        currentFilter = filterType;
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });
        renderTodos();
    };

    // --- Event Listeners ---

    // Add Todo button click
    addTodoBtn.addEventListener('click', addTodo);

    // Add Todo on Enter key press in input field
    todoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // Event delegation for todo list items (toggle, edit, delete)
    todoList.addEventListener('click', (e) => {
        const li = e.target.closest('.todo-item');
        if (!li) return; // Not a todo item click

        const id = parseInt(li.getAttribute('data-id'));

        if (e.target.classList.contains('todo-checkbox')) {
            toggleTodoCompletion(id);
        } else if (e.target.closest('.delete-btn')) {
            deleteTodo(id);
        } else if (e.target.closest('.edit-btn') || e.target.closest('.save-btn')) {
            editTodo(li);
        }
    });

    // Filter buttons click
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            setFilter(button.dataset.filter);
        });
    });

    // Clear Completed button click
    clearCompletedBtn.addEventListener('click', clearCompletedTodos);

    // --- Initialization ---
    loadTodos();       // Load todos from local storage
    renderTodos();     // Initial render of the todo list
});