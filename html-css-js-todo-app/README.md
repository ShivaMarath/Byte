# Vanilla JS Todo App

A clean, functional, and visually appealing Todo application built with pure HTML, CSS, and JavaScript. This app allows you to manage your tasks efficiently, with data persistence powered by your browser's local storage.

## Features

-   **Add New Tasks**: Quickly add new todo items.
-   **Mark as Complete**: Toggle completion status for tasks.
-   **Edit Tasks**: Modify existing task descriptions.
-   **Delete Tasks**: Remove tasks you no longer need.
-   **Filter Tasks**: View all, active, or completed tasks.
-   **Clear Completed**: Remove all completed tasks with a single click.
-   **Persistence**: All tasks are saved in your browser's local storage, so they remain even after closing and reopening the browser.
-   **Responsive Design**: Works well on various screen sizes.
-   **Input Validation**: Prevents adding empty tasks.

## Technologies Used

-   HTML5
-   CSS3
-   JavaScript (ES6+)
-   Font Awesome for icons

## Setup and Run

This project does not require any build tools or Node.js dependencies. It's a pure front-end application.

1.  **Clone the repository (if applicable) or download the project files.**

    ```bash
    git clone <repository-url>
    cd html-css-js-todo-app
    ```

    *(If you're just receiving the files directly, simply create a folder `html-css-js-todo-app` and place `index.html`, `style.css`, `script.js`, and `.gitignore` inside it.)*

2.  **Open `index.html` in your web browser.**

    You can do this by navigating to the project folder and double-clicking `index.html`, or by right-clicking it and choosing "Open with Live Server" if you have the VS Code Live Server extension installed (recommended for development).

That's it! The application will load, and you can start managing your tasks.

## Usage

-   **Adding a Task**: Type your task into the input field and click the "Add Task" button or press `Enter`.
-   **Marking as Complete**: Click the checkbox next to a task.
-   **Editing a Task**: Click the <i class="fas fa-edit"></i> (edit) icon next to a task. The task text will become editable. Press `Enter` or click outside the task to save changes.
-   **Deleting a Task**: Click the <i class="fas fa-trash-alt"></i> (delete) icon next to a task. A confirmation prompt will appear.
-   **Filtering**: Use the "All", "Active", and "Completed" buttons to filter your task list.
-   **Clearing Completed**: Click the "Clear Completed" button to remove all tasks marked as complete. A confirmation prompt will appear.
