# Robot Coder world, prepended to the learner's code (also used by the app inside Pyodide).
import json as _json
class RobotCrash(Exception): pass
class _World:
    D=[(-1,0),(0,1),(1,0),(0,-1)]  # up right down left
    def __init__(self, rows):
        self.g=[list(r) for r in rows]; self.coins=set(); self.trace=[]; self.n=0
        for r,row in enumerate(self.g):
            for c,ch in enumerate(row):
                if ch in '^>v<': self.r,self.c,self.d=r,c,'^>v<'.index(ch); self.g[r][c]='.'
                if ch=='G': self.goal=(r,c)
                if ch=='c': self.coins.add((r,c)); self.g[r][c]='.'
        self.snap('start')
    def snap(self,a): self.trace.append([self.r,self.c,self.d,a,sorted(self.coins)])
    def tick(self):
        self.n+=1
        if self.n>400: raise RobotCrash('Robot đã đi hơn 400 lệnh. Có thể vòng lặp không bao giờ dừng?')
    def free(self,d):
        dr,dc=self.D[d%4]; r,c=self.r+dr,self.c+dc
        return 0<=r<len(self.g) and 0<=c<len(self.g[r]) and self.g[r][c]!='#'
W=None
def move():
    W.tick()
    if not W.free(W.d): W.snap('crash'); raise RobotCrash('Robot đâm vào tường!')
    dr,dc=W.D[W.d]; W.r+=dr; W.c+=dc; W.snap('move')
def turn_left(): W.tick(); W.d=(W.d-1)%4; W.snap('left')
def turn_right(): W.tick(); W.d=(W.d+1)%4; W.snap('right')
def front_is_clear(): return W.free(W.d)
def left_is_clear(): return W.free(W.d-1)
def right_is_clear(): return W.free(W.d+1)
def at_goal(): return (W.r,W.c)==W.goal
def coin_here(): return (W.r,W.c) in W.coins
def pick():
    W.tick()
    if (W.r,W.c) not in W.coins: W.snap('nocoin'); raise RobotCrash('Ở đây không có đồng xu nào.')
    W.coins.discard((W.r,W.c)); W.snap('pick')
