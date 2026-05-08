
Home Exercise Backend
The attached JSON file (train-ticket-be.json) represents a full, working graph of Train Ticket microservices
and the relations between them:
https://github.com/FudanSELab/train-ticket

Assignment Description
The mission, should you choose to accept it, is to load the attached JSON file
and build a basic query engine on top of it.
Create a RESTful API for querying the graph you have created:
The API should return a graph structure, that can be easy to render in a
client side application.

The API should provide a way to filter the routes between the services,
based on the following filters:
Routes that start in a public service ( "publicExposed": true )
Routes that end in Sink (rds/sql).
Routes that have a vulnerability in one of the nodes.
Build the API to be generic as possible, so additional filters can be added
easily.

Deliverables
1. A short, written explanation of the planned solution (explaining decisions,
assumptions...) in a README file.

2. Link to a git repo with the implementation of the program (written in a
language of your choice - Preferably TypeScript)