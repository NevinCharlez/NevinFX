<?php
require __DIR__.'/config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: '.ALLOWED_ORIGIN);
header('Access-Control-Allow-Headers: Content-Type');
if($_SERVER['REQUEST_METHOD']==='OPTIONS') exit;
function out($d,$c=200){http_response_code($c);echo json_encode($d);exit;}
try{$db=new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',DB_USER,DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);}
catch(Exception $e){out(['error'=>'Database connection failed'],500);}
function q($sql,$p=[]){global $db;$s=$db->prepare($sql);$s->execute($p);return $s;}
$in=array_merge($_POST,json_decode(file_get_contents('php://input'),true)?:[]);
$a=$_GET['a']??'';
$user=null;
if(!empty($_GET['t'])){$user=q('SELECT * FROM users WHERE token=?',[$_GET['t']])->fetch()?:null;}
$premium=$user&&($user['role']==='admin'||($user['premium_until']&&strtotime($user['premium_until'])>time()));
$admin=$user&&$user['role']==='admin';
function need_admin(){global $admin;if(!$admin)out(['error'=>'Admins only'],403);}
function need_login(){global $user;if(!$user)out(['error'=>'Please log in'],401);}
function upload($key,$allowed){
  if(empty($_FILES[$key])||$_FILES[$key]['error']!==0)return null;
  $ext=strtolower(pathinfo($_FILES[$key]['name'],PATHINFO_EXTENSION));
  if(!in_array($ext,$allowed))out(['error'=>'File type not allowed'],400);
  $name=bin2hex(random_bytes(8)).'.'.$ext;
  move_uploaded_file($_FILES[$key]['tmp_name'],__DIR__.'/../uploads/'.$name);
  return $name;
}
function pub($u){return ['id'=>$u['id'],'name'=>$u['name'],'email'=>$u['email'],'role'=>$u['role'],'premium_until'=>$u['premium_until']];}
$img=['jpg','jpeg','png','webp','gif'];

switch($a){
case 'register':
  if(strlen($in['password']??'')<6||!filter_var($in['email']??'',FILTER_VALIDATE_EMAIL)||empty($in['name']))out(['error'=>'Enter name, valid email and a 6+ character password'],400);
  if(q('SELECT id FROM users WHERE email=?',[$in['email']])->fetch())out(['error'=>'Email already registered'],400);
  $tok=bin2hex(random_bytes(32));
  q('INSERT INTO users(name,email,password,token) VALUES(?,?,?,?)',[$in['name'],$in['email'],password_hash($in['password'],PASSWORD_DEFAULT),$tok]);
  $u=q('SELECT * FROM users WHERE token=?',[$tok])->fetch();out(['token'=>$tok,'user'=>pub($u)]);
case 'login':
  $u=q('SELECT * FROM users WHERE email=?',[$in['email']??''])->fetch();
  if(!$u||!password_verify($in['password']??'',$u['password']))out(['error'=>'Wrong email or password'],401);
  $tok=bin2hex(random_bytes(32));q('UPDATE users SET token=? WHERE id=?',[$tok,$u['id']]);
  out(['token'=>$tok,'user'=>pub($u)]);
case 'me': need_login(); out(['user'=>pub($user),'premium'=>$premium]);
case 'signals':
  $rows=q('SELECT * FROM signals ORDER BY id DESC LIMIT 100')->fetchAll();
  foreach($rows as &$r){ if(!$premium){$r['tp']=null;$r['sl']=null;$r['locked']=true;}else $r['locked']=false; }
  out(['premium'=>$premium,'signals'=>$rows]);
case 'results': out(q('SELECT * FROM results ORDER BY id DESC LIMIT 100')->fetchAll());
case 'pdfs': out(q('SELECT * FROM pdfs ORDER BY id DESC')->fetchAll());
case 'mentorships': out(q('SELECT * FROM mentorships')->fetchAll());
case 'pay':
  need_login();
  if(empty($in['reference']))out(['error'=>'Enter your payment reference'],400);
  q('INSERT INTO payments(user_id,kind,mentorship_id,reference) VALUES(?,?,?,?)',[$user['id'],($in['kind']??'')==='mentorship'?'mentorship':'subscription',$in['mentorship_id']??null,$in['reference']]);
  out(['ok'=>true]);
case 'add_signal': need_admin();
  q('INSERT INTO signals(pair,broker,direction,entry,tp,sl,note,image) VALUES(?,?,?,?,?,?,?,?)',[$in['pair'],$in['broker'],$in['direction'],$in['entry'],$in['tp'],$in['sl'],$in['note']??'',upload('image',$img)]);out(['ok'=>true]);
case 'set_signal_status': need_admin(); q('UPDATE signals SET status=? WHERE id=?',[$in['status'],$in['id']]);out(['ok'=>true]);
case 'add_result': need_admin();
  q('INSERT INTO results(title,pair,outcome,pips,image) VALUES(?,?,?,?,?)',[$in['title'],$in['pair'],$in['outcome'],$in['pips'],upload('image',$img)]);out(['ok'=>true]);
case 'add_pdf': need_admin();
  $f=upload('file',['pdf']);if(!$f)out(['error'=>'Choose a PDF'],400);
  q('INSERT INTO pdfs(title,description,file) VALUES(?,?,?)',[$in['title'],$in['description']??'',$f]);out(['ok'=>true]);
case 'add_mentorship': need_admin();
  q('INSERT INTO mentorships(title,description,price,duration) VALUES(?,?,?,?)',[$in['title'],$in['description'],$in['price'],$in['duration']]);out(['ok'=>true]);
case 'delete': need_admin();
  if(!in_array($in['table']??'',['signals','results','pdfs','mentorships']))out(['error'=>'Bad table'],400);
  q("DELETE FROM {$in['table']} WHERE id=?",[$in['id']]);out(['ok'=>true]);
case 'admin_payments': need_admin();
  out(q('SELECT p.*,u.name,u.email,m.title AS mentorship FROM payments p JOIN users u ON u.id=p.user_id LEFT JOIN mentorships m ON m.id=p.mentorship_id ORDER BY p.status="pending" DESC,p.id DESC')->fetchAll());
case 'review_payment': need_admin();
  $p=q('SELECT * FROM payments WHERE id=?',[$in['id']])->fetch();if(!$p)out(['error'=>'Not found'],404);
  $st=($in['status']??'')==='approved'?'approved':'rejected';q('UPDATE payments SET status=? WHERE id=?',[$st,$p['id']]);
  if($st==='approved'&&$p['kind']==='subscription'){
    q('UPDATE users SET premium_until=DATE_ADD(GREATEST(COALESCE(premium_until,NOW()),NOW()),INTERVAL '.SUB_DAYS.' DAY) WHERE id=?',[$p['user_id']]);}
  out(['ok'=>true]);
default: out(['error'=>'Unknown action'],404);
}
