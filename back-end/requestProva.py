import requests
import json

def get_tasks():
    tasks=requests.get("http://127.0.0.1:8000/get_tasks/")
    task_list = tasks.json()
    for i, task in enumerate(task_list):
        if isinstance(task, str):
            task = json.loads(task)
        task["id"] = int(task["id"])
        task_list[i] = task
    return task_list
    
def insert_task():
    tasks=get_tasks()
    id=tasks[-1]["id"]+1
    params={
        "id":id,
        "title":"Test",
        "description":"desc",
        "date":"2023-10-10T10:10:10"
    }
    r=requests.post("http://127.0.0.1:8000/insert_task/", json=params)
    print(r.status_code , " ", r.text)
    
def remove_task(id):
    r=requests.post("http://127.0.0.1:8000/remove_task/", params={"task_id":id})
    print(r.status_code , " ", r.text)
    
def modify_task(id):
    tasks = get_tasks()
    for t in tasks:
        if t["id"] == id:
            title = input(f"Titolo ({t['title']}): ") or t['title']
            description = input(f"Descrizione ({t['description']}): ") or t['description']
            date = input(f"Data ({t['date']}): ") or t['date']
            params = {
                "id": id,
                "title": title,
                "description": description,
                "date": date
            }
            r = requests.post("http://127.0.0.1:8000/update_task/", json=params)
            print(r.status_code, " ", r.text)
            return
    print("Task non trovato.")
               
def action():
    scelta=int(input("1: Inserisci task\n2: Rimuovi task\n3: Vedi tasks\n4: Aggiorna task\nQualsiasi altro valore per uscire \nScelta: "))
    if scelta==1:
        insert_task()
    elif scelta==2:
        id=int(input("ID del task da rimuovere: "))
        remove_task(id)
    elif scelta==3:
        tasks=get_tasks()
        print(tasks)
    elif scelta==4:
        tasks=get_tasks()
        id=int(input("ID del task da aggiornare: "))
        modify_task(id)
    else:
        return False  
    return True         

 
if __name__ == "__main__":
    while action():
        print("\n")
        pass
    print("Arrivederci")