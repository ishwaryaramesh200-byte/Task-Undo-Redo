const listBox = document.getElementById('list');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const saveBtn = document.createElement('button');
saveBtn.style.display = 'none';
const task = document.getElementById('task');
const addBtn = document.querySelector('.add');
const undoStack = [];
const redoStack = [];

addBtn.addEventListener('click', () => {
    const taskValue = task.value.trim();
    if (taskValue) {
        addTasks(taskValue);
        task.value = '';
    }
});

function addTasks(task) {
    if (!task) {
        const wrong = document.getElementById('wrong');
        wrong.style.display = 'block';
        wrong.style.color = 'red';
        wrong.style.fontSize = '20px';
        wrong.textContent = 'Please enter a task.';
        return;
    }
    wrong.style.display = 'none';
    redoStack.length = 0;
    const li = createListItem(task);
    listBox.appendChild(li);
    undoStack.push({
        type: "add",
        value: task
    });
}

function createListItem(task) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = task;
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.display = 'none';
    li.append(span, editBtn, deleteBtn);
    editBtn.addEventListener('click', () => {
        const oldValue = span.textContent;
        span.contentEditable = true;
        span.focus();
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        saveBtn.classList.add('save-btn');
        li.appendChild(saveBtn);
        saveBtn.addEventListener('click', () => {
            const newValue = span.textContent.trim();
            if (newValue && newValue !== oldValue) {
                redoStack.length = 0;
                span.textContent = newValue;
                undoStack.push({
                    type: "edit",
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
            editBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
        });
    });

    deleteBtn.addEventListener('click', () => {
        redoStack.length = 0;
        const index = [...listBox.children].indexOf(li);
        const items = listBox.querySelectorAll('li')[index];
        const span = items.querySelector('span');
        const content = span.textContent;
        undoStack.push({
            type: "delete",
            index: index,
            content: content
        });
        li.remove();
    });
    return li;
}

undoBtn.addEventListener('click', () => {
    if (!undoStack.length) {
        return;
    }
    const action = undoStack.pop();
    redoStack.push(action);
    switch (action.type) {
        case "add":
            listBox.removeChild(listBox.lastChild);
            break;
        case "edit":
            const items = listBox.querySelectorAll('li');
            items.forEach(item => {
                const span = item.querySelector('span');
                if (span.textContent === action.newValue) {
                    span.textContent = action.oldValue;
                }
            });
            break;
        case "delete":
            const li = createListItem(action.content);
            listBox.insertBefore(li, listBox.children[action.index]);
            break;
    }
});

redoBtn.addEventListener('click', () => {
    if (!redoStack.length) {
        return;
    }
    const action = redoStack.pop();
    undoStack.push(action);
    switch (action.type) {
        case "add":
            const li = createListItem(action.value);
            listBox.appendChild(li);
            break;
        case "edit":
            const items = listBox.querySelectorAll('li');
            items.forEach(item => {
                const span = item.querySelector('span');
                if(span.textContent == action.oldValue){
                    span.textContent =action.newValue;
                }
            });
            break;
        case "delete":
            const item = listBox.querySelectorAll('li');
            item.forEach(item => {
                const span = item.querySelector('span');
                if(span.textContent == action.content){
                    item.remove();
                }
            });
        break;
    }
});