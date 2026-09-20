import json,subprocess,os,select,time,tempfile,atexit
from pathlib import Path
# Own an isolated workspace; never overwrite files in the caller's directory.
workspace=tempfile.TemporaryDirectory(prefix='sounio-lsp-test-')
atexit.register(workspace.cleanup)
os.chdir(workspace.name)
p=subprocess.Popen(['souc','lsp','--stdio'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=open('lsp-stderr.log','wb'))
def send(value):
 data=json.dumps(value).encode();p.stdin.write(b'Content-Length: '+str(len(data)).encode()+b'\r\n\r\n'+data);p.stdin.flush()
def read_reply(expected):
 deadline=time.monotonic()+40
 while time.monotonic()<deadline:
  header=b''
  while not header.endswith(b'\r\n\r\n'):
   if not select.select([p.stdout],[],[],max(0,deadline-time.monotonic()))[0]:raise TimeoutError('LSP header')
   chunk=os.read(p.stdout.fileno(),1)
   if not chunk:raise RuntimeError('LSP exited: '+str(p.poll()))
   header+=chunk
  length=int(next(x.split(b':')[1] for x in header.split(b'\r\n') if x.lower().startswith(b'content-length:')))
  body=b''
  while len(body)<length:
   if not select.select([p.stdout],[],[],max(0,deadline-time.monotonic()))[0]:raise TimeoutError('LSP body')
   chunk=os.read(p.stdout.fileno(),length-len(body))
   if not chunk:raise RuntimeError('LSP truncated body')
   body+=chunk
  reply=json.loads(body)
  if reply.get('id')==expected:return reply
 raise TimeoutError('LSP response')
try:
 send({'jsonrpc':'2.0','id':1,'method':'initialize','params':{'processId':os.getpid(),'rootUri':Path.cwd().as_uri(),'capabilities':{}}})
 result=read_reply(1);assert 'capabilities' in result.get('result',{}),result
 send({'jsonrpc':'2.0','method':'initialized','params':{}})
 source=Path.cwd()/'sample.sio'; text='fn helper(x: i64) -> i64 { x + 1 }\nfn main() -> i32 { 0 }\n';source.write_text(text);uri=source.as_uri()
 send({'jsonrpc':'2.0','method':'textDocument/didOpen','params':{'textDocument':{'uri':uri,'languageId':'sounio','version':1,'text':text}}})
 send({'jsonrpc':'2.0','id':3,'method':'textDocument/documentSymbol','params':{'textDocument':{'uri':uri}}})
 symbols=read_reply(3);assert 'error' not in symbols,symbols
 names=[x['name'] for x in symbols['result']];assert 'helper' in names and 'main' in names,symbols
 send({'jsonrpc':'2.0','id':4,'method':'textDocument/completion','params':{'textDocument':{'uri':uri},'position':{'line':1,'character':0}}})
 completion=read_reply(4);assert 'error' not in completion,completion
 items=completion['result'];items=items.get('items',[]) if isinstance(items,dict) else items
 assert any(x.get('label')=='fn' for x in items),completion
 send({'jsonrpc':'2.0','method':'textDocument/didClose','params':{'textDocument':{'uri':uri}}})
 send({'jsonrpc':'2.0','id':2,'method':'shutdown','params':None});reply=read_reply(2);assert 'error' not in reply,reply
 send({'jsonrpc':'2.0','method':'exit','params':None});p.wait(timeout=10);assert p.returncode==0,p.returncode
 print(json.dumps({'initialize':'PASS','shutdown':'PASS','capabilities':result['result']['capabilities'],'document_symbols':names,'completion_fn':'PASS','scope':'Installed launcher lifecycle, outline names and keyword completion; not editor UI or full semantic validation'}))
except Exception:
 print(Path('lsp-stderr.log').read_text(), flush=True)
 raise
finally:
 if p.poll() is None:p.kill();p.wait()
