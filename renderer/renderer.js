/*
====================================================
OCC RENDERER CONTROLLER
Fully compatible with provided index.html
====================================================
*/

let currentStream = null
let streaming = false

let attachedFiles = []
let thinkingMode = false

let chats = JSON.parse(localStorage.getItem("occ_chats") || "{}")
let currentChatId = localStorage.getItem("occ_current_chat_id")

/*
====================================================
DOM ELEMENTS
====================================================
*/

const homeForm = document.getElementById("homeForm")
const homeInput = document.getElementById("homeInput")
const homeSendBtn = document.getElementById("homeSendBtn")

const chatForm = document.getElementById("chatForm")
const chatInput = document.getElementById("messageInput")
const chatSendBtn = document.getElementById("chatSendBtn")

const homeView = document.getElementById("homeView")
const chatView = document.getElementById("chatView")

const messagesEl = document.getElementById("chatMessages")

const historyList = document.getElementById("chatHistoryList")

const toolCallsList = document.getElementById("toolCallsList")
const emptyTools = document.getElementById("emptyTools")

/*
====================================================
INIT
====================================================
*/

document.addEventListener("DOMContentLoaded", () => {

  bindUI()

  if(currentChatId && chats[currentChatId]){
    loadChat(currentChatId)
  } else {
    newChat()
  }

})

/*
====================================================
UI BINDINGS
====================================================
*/

function bindUI(){

  /*
  ATTACH FILES
  */

  const homeFileInput = document.getElementById("homeFileInput")
  const chatFileInput = document.getElementById("chatFileInput")
  const homeAttachBtn = document.getElementById("homeAttachBtn")
  const chatAttachBtn = document.getElementById("chatAttachBtn")

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      // Basic file info for now, can be extended to read content
      attachedFiles.push({
        name: file.name,
        path: file.path, // Electron provides full path
        size: file.size,
        type: file.type
      })
    })
    renderAttachedFiles()
  }

  if(homeAttachBtn) homeAttachBtn.addEventListener("click", () => homeFileInput.click())
  if(chatAttachBtn) chatAttachBtn.addEventListener("click", () => chatFileInput.click())
  if(homeFileInput) homeFileInput.addEventListener("change", handleFileSelection)
  if(chatFileInput) chatFileInput.addEventListener("change", handleFileSelection)

  /*
  EXTENDED THINKING TOGGLE
  */

  const homeThinkingBtn = document.getElementById("homeThinkingBtn")
  const chatThinkingBtn = document.getElementById("chatThinkingBtn")

  const toggleThinking = () => {
    thinkingMode = !thinkingMode
    homeThinkingBtn?.classList.toggle("active", thinkingMode)
    chatThinkingBtn?.classList.toggle("active", thinkingMode)
    console.log("Thinking mode:", thinkingMode ? "Extended" : "Fast")
  }

  if(homeThinkingBtn) homeThinkingBtn.addEventListener("click", toggleThinking)
  if(chatThinkingBtn) chatThinkingBtn.addEventListener("click", toggleThinking)

  /*
  DROPDOWN TOGGLES
  */

  const dropdowns = document.querySelectorAll(".dropdown-container")
  
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector("button")
    if(button){
      button.addEventListener("click", (e) => {
        e.stopPropagation()
        // Close all others
        dropdowns.forEach(d => { if(d !== dropdown) d.classList.remove("open") })
        dropdown.classList.toggle("open")
      })
    }

    // Handle selection
    const items = dropdown.querySelectorAll(".dropdown-item")
    items.forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation()
        const value = item.getAttribute("data-value")
        const label = item.querySelector(".item-label").innerText
        
        // Update selection visually
        items.forEach(i => i.classList.remove("selected"))
        item.classList.add("selected")
        
        // Update button label
        const btnLabel = dropdown.querySelector(".provider-label, .model-label")
        if(btnLabel) btnLabel.innerText = label
        
        dropdown.classList.remove("open")

        console.log(`Selected ${value} for ${dropdown.id}`)
      })
    })
  })

  // Close dropdowns on outside click
  document.addEventListener("click", () => {
    dropdowns.forEach(d => d.classList.remove("open"))
  })

  /*
  HOME INPUT
  */

  if(homeInput){

    homeInput.addEventListener("input",()=>{
      homeSendBtn.disabled = homeInput.value.trim().length === 0 || streaming
    })

    homeInput.addEventListener("keydown",(e)=>{
      if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault()
        if(!homeSendBtn.disabled){
          homeForm.dispatchEvent(new Event("submit"))
        }
      }
    })

  }

  /*
  HOME FORM SUBMIT
  */

  if(homeForm){

    homeForm.addEventListener("submit",(e)=>{

      e.preventDefault()

      const prompt = homeInput.value.trim()

      if(!prompt || streaming) return

      startChatFromHome(prompt)

      homeInput.value=""
      homeSendBtn.disabled=true

    })

  }

  /*
  CHAT INPUT
  */

  if(chatInput){

    chatInput.addEventListener("input",()=>{
      chatSendBtn.disabled = chatInput.value.trim().length === 0 || streaming
    })

    chatInput.addEventListener("keydown",(e)=>{
      if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault()
        if(!chatSendBtn.disabled){
          chatForm.dispatchEvent(new Event("submit"))
        }
      }
    })

  }

  /*
  CHAT FORM SUBMIT
  */

  if(chatForm){

    chatForm.addEventListener("submit",(e)=>{

      e.preventDefault()

      const prompt = chatInput.value.trim()

      if(!prompt || streaming) return

      chatInput.value=""
      chatSendBtn.disabled=true

      sendMessage(prompt)

    })

  }

}

/*
====================================================
NEW CHAT
====================================================
*/

window.startNewChat = function(){

  newChat()

  homeView.classList.remove("hidden")
  chatView.classList.add("hidden")

}

function newChat(){

  currentChatId = "chat_" + Date.now()

  chats[currentChatId] = []
  
  localStorage.setItem("occ_chats", JSON.stringify(chats))
  localStorage.setItem("occ_current_chat_id", currentChatId)

  renderHistory()

  clearMessages()

}

/*
====================================================
START CHAT FROM HOME
====================================================
*/

function startChatFromHome(prompt){

  newChat()

  homeView.classList.add("hidden")
  chatView.classList.remove("hidden")

  sendMessage(prompt)

}

/*
====================================================
SEND MESSAGE
====================================================
*/

function sendMessage(text){

  if(streaming) return

  if(!currentChatId) newChat()

  addMessage("user", text)

  startStream(text)

}

/*
====================================================
ADD MESSAGE
====================================================
*/

function addMessage(role, content){

  const msg = { role, content }

  if(!chats[currentChatId]) chats[currentChatId] = []
  
  chats[currentChatId].push(msg)
  
  // Update chat title if this is the first user message
  if(role === "user" && chats[currentChatId].length === 1){
    const title = content.length > 30 ? content.substring(0, 30) + "..." : content
    updateChatTitle(currentChatId, title)
  }
  
  localStorage.setItem("occ_chats", JSON.stringify(chats))

  renderMessage(msg)

}

function updateChatTitle(id, title){
  // Find the history item and update its text
  const items = historyList.querySelectorAll(".chat-history-item")
  items.forEach(item => {
    const titleSpan = item.querySelector(".chat-title")
    if(titleSpan && item.getAttribute("data-id") === id){
      titleSpan.innerText = title
    }
  })
}

function renderMessage(msg){

  const messageDiv = document.createElement("div")
  messageDiv.className = "message " + msg.role

  if(msg.role === "assistant"){
    const iconDiv = document.createElement("div")
    iconDiv.className = "message-icon"
    iconDiv.innerHTML = `
      <svg class="asterisk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"></path>
      </svg>
    `
    messageDiv.appendChild(iconDiv)
  }

  const contentDiv = document.createElement("div")
  contentDiv.className = "message-content"

  // Support markdown rendering if available
  if(window.marked && msg.role === "assistant"){
    contentDiv.innerHTML = marked.parse(msg.content)
  } else {
    contentDiv.innerText = msg.content
  }

  messageDiv.appendChild(contentDiv)
  messagesEl.appendChild(messageDiv)

  messagesEl.scrollTop = messagesEl.scrollHeight

}

/*
====================================================
CLEAR CHAT
====================================================
*/

function clearMessages(){

  messagesEl.innerHTML=""

}

/*
====================================================
STREAM
====================================================
*/

function renderAttachedFiles(){
  // Clear existing previews if any
  document.querySelectorAll(".attached-files").forEach(el => el.innerHTML = "")
  
  if(attachedFiles.length === 0) return

  const renderTo = (containerId) => {
    const container = document.getElementById(containerId)
    if(!container) return
    
    // Create or get the wrapper
    let wrapper = container.querySelector(".attached-files")
    if(!wrapper){
      wrapper = document.createElement("div")
      wrapper.className = "attached-files"
      // Insert after the input textarea but before controls
      const textarea = container.querySelector("textarea")
      if(textarea) textarea.after(wrapper)
    }

    wrapper.innerHTML = attachedFiles.map((file, index) => `
      <div class="attached-file">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        <span>${file.name}</span>
        <button type="button" class="remove-file" onclick="removeAttachedFile(${index})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `).join("")
  }

  renderTo("homeForm")
  renderTo("chatForm")
}

window.removeAttachedFile = function(index){
  attachedFiles.splice(index, 1)
  renderAttachedFiles()
}

function startStream(prompt){

  if(currentStream) stopStream()

  streaming = true
  updateSendButtons()

  const assistantDiv = document.createElement("div")
  assistantDiv.className = "message assistant thinking"

  const iconDiv = document.createElement("div")
  iconDiv.className = "message-icon"
  iconDiv.innerHTML = `
    <svg class="asterisk-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"></path>
    </svg>
  `
  assistantDiv.appendChild(iconDiv)

  const contentDiv = document.createElement("div")
  contentDiv.className = "message-content"
  contentDiv.innerText = "Thinking..."

  assistantDiv.appendChild(contentDiv)
  messagesEl.appendChild(assistantDiv)

  // Get current provider and model from dropdowns
  const providerDropdown = document.querySelector("#chatView").classList.contains("hidden") 
    ? document.querySelector("#homeProviderDropdown") 
    : document.querySelector("#chatProviderDropdown")
    
  const modelDropdown = document.querySelector("#chatView").classList.contains("hidden") 
    ? document.querySelector("#homeModelDropdown") 
    : document.querySelector("#chatModelDropdown")

  const provider = providerDropdown?.querySelector(".dropdown-item.selected")?.getAttribute("data-value") || "claude"

  // Prepare query params with files and thinking mode
  const params = new URLSearchParams({
    prompt: prompt,
    provider: provider,
    thinking: thinkingMode
  })

  // Add files as JSON string if any
  if(attachedFiles.length > 0){
    params.append("files", JSON.stringify(attachedFiles.map(f => ({ name: f.name, path: f.path }))))
  }

  console.log("[SSE] Sending request with files:", attachedFiles.map(f => f.name));

  const url = `http://localhost:3001/chat?${params.toString()}`

  currentStream = new EventSource(url)

  // Fail-safe: force close stream if it hangs for more than 60 seconds
  const streamTimeout = setTimeout(() => {
    if(streaming){
      console.warn("[SSE] Stream timed out after 60s");
      stopStream();
    }
  }, 60000);

  // Clear attached files after sending
  attachedFiles = []
  renderAttachedFiles()

  let assistantContent = ""
  let hasReceivedContent = false

  currentStream.onmessage = (event)=>{

    try{

      const data = JSON.parse(event.data)

      // Filter internal agent telemetry from the chat bubbles
      const isTelemetry = (content) => {
        if (!content) return false;
        return content.includes("Task task_") || 
               content.includes("Task created") ||
               content.includes("Observer retry") || 
               content.includes("Plan:");
      };

      if(data.type === "content" || data.type === "text"){
        if (isTelemetry(data.content)) {
          // Route telemetry to the tool progress panel instead of chat
          renderTelemetry(data.content);
          return;
        }

        if(!hasReceivedContent){
          contentDiv.innerText = ""
          assistantDiv.classList.remove("thinking")
          hasReceivedContent = true
        }
        assistantContent += data.content
      }

      if(data.type === "done"){
        clearTimeout(streamTimeout);
      }

      handleEvent(data, contentDiv)

    }catch(err){

      console.error("[SSE Parse Error]", err)

    }

  }

  currentStream.onerror = (err)=>{

    clearTimeout(streamTimeout);
    console.error("[SSE Stream Error]", err)

    if(assistantContent){
      addAssistantMessage(assistantContent)
    }

    if(!hasReceivedContent){
      contentDiv.innerText = "Error: Connection lost."
      assistantDiv.classList.remove("thinking")
      assistantDiv.classList.add("error")
    }

    stopStream()

  }

}

function updateSendButtons(){
  if(homeSendBtn) homeSendBtn.disabled = homeInput.value.trim().length === 0 || streaming
  if(chatSendBtn) chatSendBtn.disabled = chatInput.value.trim().length === 0 || streaming
}

function addAssistantMessage(content){

  const msg = { role: "assistant", content }

  if(currentChatId && chats[currentChatId]){

    chats[currentChatId].push(msg)
    
    localStorage.setItem("occ_chats", JSON.stringify(chats))

  }

}

function stopStream(){

  streaming=false
  updateSendButtons()

  if(currentStream){

    currentStream.close()

    currentStream=null

  }

}

/*
====================================================
EVENT HANDLER
====================================================
*/

function handleEvent(event, contentEl){

  if(event.type==="text" || event.type==="content"){

    // Accumulate content and render
    const currentText = contentEl.getAttribute("data-raw") || ""
    const newText = currentText + event.content
    contentEl.setAttribute("data-raw", newText)

    if(window.marked){
      contentEl.innerHTML = marked.parse(newText)
    } else {
      contentEl.innerText = newText
    }

  }

  if(event.type==="tool_use" || event.type==="tooluse"){

    renderToolCall(event.name, event.input || {})

  }

  if(event.type==="tool_result" || event.type==="toolresult"){

    renderToolResult(event.name, event.result || event.content)

  }

  if(event.type==="error"){

    contentEl.innerText = "Error: " + (event.message || "Unknown error")
    contentEl.parentElement.classList.add("error")
    stopStream()

  }

  if(event.type==="done"){

    const finalContent = contentEl.getAttribute("data-raw") || contentEl.innerText

    // Check if it's already added to history
    const history = chats[currentChatId] || []
    const existing = history.length > 0 && 
                     history[history.length - 1].role === "assistant" && 
                     history[history.length - 1].content === finalContent

    if(!existing){
      addAssistantMessage(finalContent)
    }

    stopStream()

  }

}

/*
====================================================
TOOL PANEL
====================================================
*/

function renderToolCall(name, input){

  emptyTools.style.display="none"

  const card = document.createElement("div")
  card.className="tool-call"
  card.innerHTML=`
  <div class="tool-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
    <strong>${name}</strong>
    <span class="status-badge running">Running...</span>
  </div>
  <pre>${JSON.stringify(input,null,2)}</pre>
  `
  toolCallsList.appendChild(card)

  // Also add to chat
  const chatCard = document.createElement("div")
  chatCard.className = "message assistant tool-card"
  chatCard.innerHTML = `
    <div class="message-content">
      <div class="thinking-section" open>
        <summary class="thinking-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          <span>Executing ${name}...</span>
        </summary>
        <div class="thinking-content">
          <pre>${JSON.stringify(input,null,2)}</pre>
        </div>
      </div>
    </div>
  `
  messagesEl.appendChild(chatCard)
  messagesEl.scrollTop = messagesEl.scrollHeight

}

function renderToolResult(name, result){

  // Update sidebar card
  const cards = toolCallsList.querySelectorAll(".tool-call")
  if(cards.length > 0){
    const lastSidebarCard = cards[cards.length - 1]
    const badge = lastSidebarCard.querySelector(".status-badge")
    if(badge){
      badge.innerText = "Completed"
      badge.className = "status-badge completed"
    }
    const resultPre = document.createElement("pre")
    resultPre.className = "tool-output"
    resultPre.innerText = typeof result === "object" ? JSON.stringify(result, null, 2) : result
    lastSidebarCard.appendChild(resultPre)
  }

  // Update last tool card in chat if possible
  const toolCards = messagesEl.querySelectorAll(".tool-card")
  if(toolCards.length > 0){
    const lastCard = toolCards[toolCards.length - 1]
    const contentArea = lastCard.querySelector(".thinking-content")
    if(contentArea){
      const resultDiv = document.createElement("div")
      resultDiv.className = "tool-result-area"
      resultDiv.style.marginTop = "8px"
      resultDiv.style.borderTop = "1px solid var(--border-light)"
      resultDiv.style.paddingTop = "8px"
      const content = typeof result === "object" ? JSON.stringify(result, null, 2) : result
      resultDiv.innerHTML = `<strong>Result:</strong><pre>${content}</pre>`
      contentArea.appendChild(resultDiv)
    }
  }

}

/*
====================================================
TELEMETRY
====================================================
*/

function renderTelemetry(content){

  emptyTools.style.display="none"

  const card = document.createElement("div")
  card.className="tool-call telemetry"
  card.style.borderLeft = "4px solid var(--primary)"
  
  const header = document.createElement("div")
  header.className = "tool-header"
  header.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"></path>
    </svg>
    <strong>Agent Event</strong>
  `
  
  const body = document.createElement("pre")
  body.style.whiteSpace = "pre-wrap"
  body.innerText = content
  
  card.appendChild(header)
  card.appendChild(body)
  toolCallsList.appendChild(card)
  
  toolCallsList.scrollTop = toolCallsList.scrollHeight

}

/*
====================================================
CHAT HISTORY
====================================================
*/

function renderHistory(){

  historyList.innerHTML=""

  Object.keys(chats).forEach(id=>{

    const item = document.createElement("div")

    item.className="chat-history-item"
    item.setAttribute("data-id", id)
    if(id === currentChatId) item.classList.add("active")

    // Use first message as title if available
    let title = id
    if(chats[id] && chats[id].length > 0){
      const firstUserMsg = chats[id].find(m => m.role === "user")
      if(firstUserMsg){
        title = firstUserMsg.content.length > 30 ? firstUserMsg.content.substring(0, 30) + "..." : firstUserMsg.content
      }
    }

    item.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="chat-title">${title}</span>
    `

    item.addEventListener("click",()=>{

      loadChat(id)

    })

    historyList.appendChild(item)

  })

}

function loadChat(id){

  currentChatId=id

  clearMessages()

  chats[id].forEach(renderMessage)

}