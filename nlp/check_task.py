#!/usr/bin/env python3
"""
Utility to check the status of a specific Celery task
"""

import sys
import redis
import json
from celery_config import app

def check_task(task_id):
    """Check status of a specific task"""
    if not task_id:
        print("Please provide a task ID")
        return
        
    print(f"Checking task: {task_id}")
    
    # Try to get task result directly from Celery
    task = app.AsyncResult(task_id)
    
    print(f"Task state: {task.state}")
    print(f"Task status: {task.status}")
    
    if task.ready():
        if task.successful():
            print("Task completed successfully")
            try:
                result = task.get()
                print(f"Result: {json.dumps(result, indent=2)}")
            except Exception as e:
                print(f"Error getting result: {e}")
        else:
            print("Task failed")
            try:
                print(f"Error: {task.traceback}")
            except:
                print("No error traceback available")
    else:
        print("Task is still pending or in progress")
    
    # Check Redis directly
    try:
        broker_url = app.conf.broker_url
        redis_host = broker_url.split('@')[1].split(':')[0] if '@' in broker_url else broker_url.split('//')[1].split(':')[0]
        redis_port = int(broker_url.split(':')[-1].split('/')[0])
        
        r = redis.Redis(host=redis_host, port=redis_port)
        
        # Check if task exists in Redis
        result_key = f'celery-task-meta-{task_id}'
        if r.exists(result_key):
            print(f"\nTask found in Redis: {result_key}")
            result_data = r.get(result_key)
            try:
                result_json = json.loads(result_data)
                print(f"Task data in Redis: {json.dumps(result_json, indent=2)}")
            except:
                print(f"Raw data: {result_data}")
        else:
            print(f"\nTask not found in Redis")
            
            # Check active tasks
            active_tasks = app.control.inspect().active()
            if active_tasks:
                for worker, tasks in active_tasks.items():
                    for t in tasks:
                        if t.get('id') == task_id:
                            print(f"Task {task_id} is active on worker {worker}")
                            print(f"Task info: {json.dumps(t, indent=2)}")
                            return
            
            # Check reserved tasks
            reserved_tasks = app.control.inspect().reserved()
            if reserved_tasks:
                for worker, tasks in reserved_tasks.items():
                    for t in tasks:
                        if t.get('id') == task_id:
                            print(f"Task {task_id} is reserved on worker {worker}")
                            print(f"Task info: {json.dumps(t, indent=2)}")
                            return
            
            print("Task not found in active or reserved tasks")
    except Exception as e:
        print(f"Error checking Redis: {e}")
        
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_task.py <task_id>")
        sys.exit(1)
        
    check_task(sys.argv[1]) 