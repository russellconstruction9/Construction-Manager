
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse, Chat as GeminiChat, Part } from '@google/genai';
import { useData } from './useDataContext';
import { Chat, ProjectType, TaskStatus, User, InventoryItem, OrderListItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are an AI assistant for a construction project management app. Your goal is to help users manage their projects efficiently by calling the available functions.
Today's date is October 20, 2025.
When a user asks you to perform an action (like creating a project, task, etc.), and they don't provide all the necessary information (like dates, descriptions, assignees), you MUST NOT ask for the missing information.
Instead, you must intelligently fill in the blanks with realistic, plausible data based on the context. For example:
- If a start date is missing, assume it's today. If an end date is missing, set it for a reasonable time in the future (e.g., a few weeks or months from now). Dates must be in YYYY-MM-DD format.
- If a budget is missing, invent a reasonable number for the project type (e.g., $50,000 for a small renovation, $500,000 for new construction).
- If an assignee for a task is missing, check the list of users and assign it to a relevant person. If no one seems relevant, pick one at random.
- If a description is missing, create a concise one based on the title.
- If a project name is needed for a task and not provided, try to infer it from the context or the user's current activity. If not possible, use the most recently active project.
Your primary goal is to execute the function call. Be proactive and get things done. After a function is executed, confirm the action you have taken in a friendly and concise message.`;


const functionDeclarations: FunctionDeclaration[] = [
    // Project Management
    {
        name: 'addProject',
        description: 'Creates a new construction project. Use this when a user wants to start a new project.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The official name of the project.' },
                address: { type: Type.STRING, description: 'The physical address of the project site.' },
                type: { type: Type.STRING, enum: Object.values(ProjectType), description: 'The category of the construction project.' },
                status: { type: Type.STRING, enum: ['In Progress', 'On Hold'], description: 'The initial status of the project.' },
                startDate: { type: Type.STRING, description: 'The project start date in YYYY-MM-DD format.' },
                endDate: { type: Type.STRING, description: 'The project end date in YYYY-MM-DD format.' },
                budget: { type: Type.NUMBER, description: 'The total budget allocated for the project.' },
            },
            required: ['name', 'address', 'type', 'status', 'startDate', 'endDate', 'budget']
        }
    },
    // Task Management
    {
        name: 'addTask',
        description: 'Adds a new task to a specific project and assigns it to a team member.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'A brief, clear title for the task.' },
                description: { type: Type.STRING, description: 'A detailed description of what the task involves.' },
                projectName: { type: Type.STRING, description: 'The name of the project this task belongs to.' },
                assigneeName: { type: Type.STRING, description: 'The name of the team member assigned to this task.' },
                dueDate: { type: Type.STRING, description: 'The due date for the task in YYYY-MM-DD format.' },
            },
            required: ['title', 'projectName', 'assigneeName', 'dueDate']
        }
    },
    {
        name: 'updateTaskStatus',
        description: "Updates the status of an existing task (e.g., 'To Do', 'In Progress', 'Done').",
        parameters: {
            type: Type.OBJECT,
            properties: {
                taskTitle: { type: Type.STRING, description: 'The title of the task to update.' },
                newStatus: { type: Type.STRING, enum: Object.values(TaskStatus), description: 'The new status for the task.' },
            },
            required: ['taskTitle', 'newStatus']
        }
    },
    // Photo Management
    {
        name: 'addPhotoToProject',
        description: 'Adds a photo to a project. The user must have uploaded a photo for this to work.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectName: { type: Type.STRING, description: 'The name of the project to add the photo to.' },
                description: { type: Type.STRING, description: 'A description for the photo.' },
            },
            required: ['projectName', 'description']
        }
    },
    // Time Tracking
    {
        name: 'toggleClockInOut',
        description: 'Clocks the current user in or out of a project. If clocking in, the project name is required.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectName: { type: Type.STRING, description: 'The name of the project to clock in to. Not needed for clocking out.' },
            },
            required: []
        }
    },
    {
        name: 'switchJob',
        description: 'Clocks the user out of their current job and immediately into a new one.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                newProjectName: { type: Type.STRING, description: 'The name of the new project to switch to.' },
            },
            required: ['newProjectName']
        }
    },
    // Team Management
    {
        name: 'addUser',
        description: 'Adds a new team member to the system.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The full name of the new team member.' },
                role: { type: Type.STRING, description: 'The job title or role of the team member.' },
                hourlyRate: { type: Type.NUMBER, description: 'The hourly pay rate for the team member.' },
                roleType: { type: Type.STRING, enum: ['Admin', 'Employee'], description: 'The permission level (Admin or Employee). Defaults to Employee.' },
            },
            required: ['name', 'role', 'hourlyRate']
        }
    },
    // Punch List
    {
        name: 'addPunchListItem',
        description: 'Adds a new item to a project\'s punch list.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectName: { type: Type.STRING, description: 'The name of the project to add the item to.' },
                text: { type: Type.STRING, description: 'The description of the punch list item.' },
            },
            required: ['projectName', 'text']
        }
    },
    {
        name: 'togglePunchListItemCompletion',
        description: 'Toggles the completion status of a punch list item.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectName: { type: Type.STRING, description: 'The name of the project containing the item.' },
                itemText: { type: Type.STRING, description: 'The text of the punch list item to toggle.' },
            },
            required: ['projectName', 'itemText']
        }
    },
    // Inventory Management
    {
        name: 'addInventoryItem',
        description: 'Adds a new item to the main inventory list.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The name of the inventory item.' },
                quantity: { type: Type.NUMBER, description: 'The initial quantity of the item.' },
                unit: { type: Type.STRING, description: 'The unit of measurement (e.g., pieces, bags, ft).' },
                lowStockThreshold: { type: Type.NUMBER, description: 'Optional quantity at which to trigger a low stock warning.' },
            },
            required: ['name', 'quantity', 'unit']
        }
    },
    {
        name: 'updateInventoryItemQuantity',
        description: 'Updates the quantity of an inventory item by a certain amount (can be positive or negative).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                itemName: { type: Type.STRING, description: 'The name of the inventory item to update.' },
                change: { type: Type.NUMBER, description: 'The amount to change the quantity by (e.g., 5 to add, -5 to remove).' },
            },
            required: ['itemName', 'change']
        }
    },
    {
        name: 'updateInventoryItemDetails',
        description: 'Updates the details of an existing inventory item, such as its name, unit, or low stock threshold.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                itemName: { type: Type.STRING, description: 'The current name of the item to update.' },
                newName: { type: Type.STRING, description: 'The new name for the item.' },
                newUnit: { type: Type.STRING, description: 'The new unit of measurement.' },
                newLowStockThreshold: { type: Type.NUMBER, description: 'The new low stock threshold.' },
            },
            required: ['itemName']
        }
    },
    {
        name: 'addToOrderList',
        description: 'Adds an existing inventory item to the order list.',
        parameters: { type: Type.OBJECT, properties: { itemName: { type: Type.STRING, description: 'The name of the inventory item to add.' } }, required: ['itemName'] }
    },
    {
        name: 'addManualItemToOrderList',
        description: 'Adds a non-inventory, one-off item to the order list.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The name of the manual item to add.' },
            },
            required: ['name']
        }
    },
     {
        name: 'removeFromOrderList',
        description: 'Removes an item from the order list.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                itemName: { type: Type.STRING, description: 'The name of the item to remove. Specify if it was a manual add if known.' },
            },
            required: ['itemName']
        }
    },
    {
        name: 'clearOrderList',
        description: 'Removes all items from the order list.',
        parameters: { type: Type.OBJECT, properties: {} }
    },
    // Data Retrieval
    {
        name: 'listData',
        description: 'Retrieves a list of all projects, tasks, users, or inventory items.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                dataType: { type: Type.STRING, enum: ['projects', 'tasks', 'users', 'inventory', 'order list'], description: "The type of data to list." }
            },
            required: ['dataType']
        }
    }
];

export const useGemini = () => {
    const [history, setHistory] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dataContext = useData();
    const chatSessionRef = useRef<GeminiChat | null>(null);
    const latestUserImage = useRef<string | undefined>(undefined);

    // Initialize chat session once
    useEffect(() => {
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { 
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations }] 
            }
        });
    }, []);

    const findProjectByName = (name: string) => dataContext.projects.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
    const findUserByName = (name: string) => dataContext.users.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
    const findTaskByTitle = (title: string) => dataContext.tasks.find(t => t.title.toLowerCase().includes(title.toLowerCase()));
    const findInventoryItemByName = (name: string) => dataContext.inventory.find(i => i.name.toLowerCase().includes(name.toLowerCase()));

    const functions = {
        addProject: ({ name, address, type, status, startDate, endDate, budget }: any) => {
            dataContext.addProject({ name, address, type, status, startDate: new Date(startDate), endDate: new Date(endDate), budget });
            return { success: true, message: `Project "${name}" has been created.` };
        },
        addTask: ({ title, description, projectName, assigneeName, dueDate }: any) => {
            const project = findProjectByName(projectName);
            const assignee = findUserByName(assigneeName);
            if (!project) return { success: false, message: `Project "${projectName}" not found.` };
            if (!assignee) return { success: false, message: `User "${assigneeName}" not found.` };
            dataContext.addTask({ title, description: description || '', projectId: project.id, assigneeId: assignee.id, dueDate: new Date(dueDate) });
            return { success: true, message: `Task "${title}" has been added to ${projectName} and assigned to ${assignee.name}.` };
        },
        updateTaskStatus: ({ taskTitle, newStatus }: any) => {
            const task = findTaskByTitle(taskTitle);
            if (!task) return { success: false, message: `Task "${taskTitle}" not found.` };
            dataContext.updateTaskStatus(task.id, newStatus);
            return { success: true, message: `Task "${taskTitle}" status updated to ${newStatus}.` };
        },
        addPhotoToProject: ({ projectName, description }: { projectName: string, description: string }) => {
            if (!latestUserImage.current) {
                return { success: false, message: "An image was not provided with the user's message." };
            }
            const project = findProjectByName(projectName);
            if (!project) return { success: false, message: `Project "${projectName}" not found.` };
            
            const dataUrl = `data:image/jpeg;base64,${latestUserImage.current}`;
            dataContext.addPhoto(project.id, [dataUrl], description);
            
            return { success: true, message: `Photo added to project "${projectName}" with description: "${description}".` };
        },
        toggleClockInOut: ({ projectName }: { projectName?: string }) => {
            const { currentUser, toggleClockInOut } = dataContext;
            if (currentUser?.isClockedIn) {
                toggleClockInOut();
                return { success: true, message: `You have been clocked out.` };
            } else {
                if (!projectName) return { success: false, message: 'You must specify a project to clock in.' };
                const project = findProjectByName(projectName);
                if (!project) return { success: false, message: `Project "${projectName}" not found.` };
                toggleClockInOut(project.id);
                return { success: true, message: `You are now clocked in to ${projectName}.` };
            }
        },
        switchJob: ({ newProjectName }: { newProjectName: string }) => {
            const project = findProjectByName(newProjectName);
            if (!project) return { success: false, message: `Project "${newProjectName}" not found.` };
            if (!dataContext.currentUser?.isClockedIn) return { success: false, message: "You must be clocked in to switch jobs." };
            dataContext.switchJob(project.id);
            return { success: true, message: `Successfully switched to project "${newProjectName}".` };
        },
        addUser: ({ name, role, hourlyRate, roleType }: any) => {
            dataContext.addUser({ 
                name, 
                role, 
                hourlyRate, 
                roleType: (roleType === 'Admin' || roleType === 'Employee') ? roleType : 'Employee' 
            });
            return { success: true, message: `Team member "${name}" has been added.` };
        },
        addPunchListItem: ({ projectName, text }: any) => {
            const project = findProjectByName(projectName);
            if (!project) return { success: false, message: `Project "${projectName}" not found.` };
            dataContext.addPunchListItem(project.id, text);
            return { success: true, message: `Added punch list item to "${projectName}".` };
        },
        togglePunchListItemCompletion: ({ projectName, itemText }: any) => {
            const project = findProjectByName(projectName);
            if (!project) return { success: false, message: `Project "${projectName}" not found.` };
            const item = project.punchList.find(i => i.text.toLowerCase().includes(itemText.toLowerCase()));
            if (!item) return { success: false, message: `Punch list item "${itemText}" not found in ${projectName}.` };
            dataContext.togglePunchListItem(project.id, item.id);
            return { success: true, message: `Punch list item "${itemText}" status has been toggled.` };
        },
        addInventoryItem: ({ name, quantity, unit, lowStockThreshold }: any) => {
            dataContext.addInventoryItem({ name, quantity, unit, lowStockThreshold });
            return { success: true, message: `Added "${name}" to inventory.` };
        },
        updateInventoryItemQuantity: ({ itemName, change }: any) => {
            const item = findInventoryItemByName(itemName);
            if (!item) return { success: false, message: `Inventory item "${itemName}" not found.` };
            dataContext.updateInventoryItemQuantity(item.id, item.quantity + change);
            return { success: true, message: `Updated quantity for "${itemName}".` };
        },
        updateInventoryItemDetails: ({ itemName, newName, newUnit, newLowStockThreshold }: { itemName: string, newName?: string, newUnit?: string, newLowStockThreshold?: number }) => {
            const item = findInventoryItemByName(itemName);
            if (!item) return { success: false, message: `Inventory item "${itemName}" not found.` };
            
            const updates: Partial<Omit<InventoryItem, 'id' | 'quantity'>> = {};
            if (newName) updates.name = newName;
            if (newUnit) updates.unit = newUnit;
            if (newLowStockThreshold !== undefined) updates.lowStockThreshold = newLowStockThreshold;

            if (Object.keys(updates).length === 0) {
                return { success: false, message: "No new details were provided to update." };
            }

            dataContext.updateInventoryItem(item.id, updates);
            return { success: true, message: `Details for "${itemName}" have been updated.` };
        },
        addToOrderList: ({ itemName }: any) => {
            const item = findInventoryItemByName(itemName);
            if (!item) return { success: false, message: `Inventory item "${itemName}" not found.` };
            dataContext.addToOrderList(item.id);
            return { success: true, message: `Added "${itemName}" to the order list.` };
        },
        addManualItemToOrderList: ({ name }: { name: string }) => {
            dataContext.addManualItemToOrderList(name);
            return { success: true, message: `Manually added "${name}" to the order list.` };
        },
        removeFromOrderList: ({ itemName }: { itemName: string }) => {
            const orderList = dataContext.orderList;
            const inventory = dataContext.inventory;

            const itemToRemove = orderList.find(orderItem => {
                if (orderItem.type === 'inventory') {
                    const item = inventory.find(i => i.id === orderItem.itemId);
                    return item && item.name.toLowerCase().includes(itemName.toLowerCase());
                } else { // manual
                    return orderItem.name.toLowerCase().includes(itemName.toLowerCase());
                }
            });

            if (!itemToRemove) {
                return { success: false, message: `Item "${itemName}" not found in the order list.` };
            }
            
            dataContext.removeFromOrderList(itemToRemove as OrderListItem);
            return { success: true, message: `Removed "${itemName}" from the order list.` };
        },
        clearOrderList: () => {
            dataContext.clearOrderList();
            return { success: true, message: 'The order list has been cleared.' };
        },
        listData: ({ dataType }: { dataType: string }) => {
            let data: any[] = [];
            let fields: string[] = [];
            let title = dataType.charAt(0).toUpperCase() + dataType.slice(1);

            switch (dataType) {
                case 'projects': data = dataContext.projects; fields = ['name', 'status', 'type']; break;
                case 'tasks': data = dataContext.tasks.map(t => ({...t, projectName: findProjectByName(t.projectId.toString())?.name, assigneeName: findUserByName(t.assigneeId.toString())?.name })); fields = ['title', 'status', 'projectName', 'assigneeName']; break;
                case 'users': data = dataContext.users; fields = ['name', 'role', 'isClockedIn']; break;
                case 'inventory': data = dataContext.inventory; fields = ['name', 'quantity', 'unit']; break;
                case 'order list': 
                    data = dataContext.orderList.map(o => {
                        if (o.type === 'inventory') {
                            const item = dataContext.inventory.find(i => i.id === o.itemId);
                            return { name: item?.name || 'Unknown Item', type: 'Inventory' };
                        }
                        return { name: o.name, type: 'Manual' };
                    });
                    fields = ['name', 'type'];
                    break;
            }
            if(data.length === 0) return { success: true, message: `There are no ${dataType}.`, data: [] };
            
            const formattedData = data.map(item => "- " + fields.map(field => `${item[field]}`).join(' | ')).join('\n');
            return { success: true, message: `Here is the list of ${title}:\n${formattedData}`, data };
        }
    };

    const sendMessage = async (message: string, image?: string) => {
        if (!chatSessionRef.current) return;
        setIsLoading(true);
        const userMessage: Chat = { sender: 'user', message, image };
        setHistory(prev => [...prev, userMessage]);

        const parts: Part[] = [];
        let promptText = message;
        latestUserImage.current = image;

        if (image) {
            promptText = `The user has uploaded an image and says: "${message}". Analyze the request and the image content. Call the most appropriate function, like 'addProject' if it's a new project plan, or 'addPhotoToProject' if it's a progress photo for an existing project. Fill in any missing details like project name or description based on the conversation history and image content.`;
            parts.push({
                inlineData: { mimeType: 'image/jpeg', data: image }
            });
        }
        
        parts.unshift({ text: promptText });
        
        try {
            let response: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: parts });

            while (response.functionCalls && response.functionCalls.length > 0) {
                 const functionResponseParts = response.functionCalls.map((funcCall) => {
                    // @ts-ignore
                    const result = functions[funcCall.name](funcCall.args);
                    return {
                        functionResponse: {
                            name: funcCall.name,
                            response: result,
                        },
                    };
                 });
                response = await chatSessionRef.current.sendMessage({ message: functionResponseParts });
            }
            
            const modelResponse: Chat = { sender: 'model', message: response.text };
            setHistory(prev => [...prev, modelResponse]);

        } catch (error) {
            console.error(error);
            const errorResponse: Chat = { sender: 'model', message: "Sorry, I encountered an error." };
            setHistory(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    return { history, sendMessage, isLoading };
};
