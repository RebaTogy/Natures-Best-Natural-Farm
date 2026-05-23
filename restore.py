import json
import re

transcript_path = r"C:\Users\HP\.gemini\antigravity\brain\33f80c36-8944-4fd4-b908-525abfea5908\.system_generated\logs\transcript.jsonl"
files = {
    169: r"e:\Natures Best Natural Farm\src\app\product\[id]\page.tsx",
    174: r"e:\Natures Best Natural Farm\src\app\prebook\[batchId]\page.tsx",
    183: r"e:\Natures Best Natural Farm\src\app\order\[id]\page.tsx",
    185: r"e:\Natures Best Natural Farm\src\app\farmer\[id]\page.tsx"
}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line.strip())
            step = obj.get("step_index")
            if step in files:
                code = obj["tool_calls"][0]["args"]["CodeContent"]
                
                if code.startswith('"') and code.endswith('"'):
                    try:
                        code = json.loads(code)
                    except:
                        pass
                        
                with open(files[step], 'w', encoding='utf-8') as out:
                    out.write(code)
                print(f"Written {files[step]}")
        except Exception as e:
            pass
