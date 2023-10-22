// @ts-nocheck
export default {
  "kind": "Document",
  "definitions": [
    {
      "kind": "SchemaDefinition",
      "directives": [
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "link"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "url"
              },
              "value": {
                "kind": "StringValue",
                "value": "https://specs.apollo.dev/link/v1.0",
                "block": false
              }
            }
          ]
        },
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "link"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "url"
              },
              "value": {
                "kind": "StringValue",
                "value": "https://specs.apollo.dev/join/v0.3",
                "block": false
              }
            },
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "for"
              },
              "value": {
                "kind": "EnumValue",
                "value": "EXECUTION"
              }
            }
          ]
        }
      ],
      "operationTypes": [
        {
          "kind": "OperationTypeDefinition",
          "operation": "query",
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Query"
            }
          }
        }
      ]
    },
    {
      "kind": "DirectiveDefinition",
      "name": {
        "kind": "Name",
        "value": "join__enumValue"
      },
      "arguments": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "graph"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "join__Graph"
              }
            }
          },
          "directives": []
        }
      ],
      "repeatable": true,
      "locations": [
        {
          "kind": "Name",
          "value": "ENUM_VALUE"
        }
      ]
    },
    {
      "kind": "DirectiveDefinition",
      "name": {
        "kind": "Name",
        "value": "join__field"
      },
      "arguments": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "graph"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "join__Graph"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "requires"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "join__FieldSet"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "provides"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "join__FieldSet"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "type"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "external"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Boolean"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "override"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "usedOverridden"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "Boolean"
            }
          },
          "directives": []
        }
      ],
      "repeatable": true,
      "locations": [
        {
          "kind": "Name",
          "value": "FIELD_DEFINITION"
        },
        {
          "kind": "Name",
          "value": "INPUT_FIELD_DEFINITION"
        }
      ]
    },
    {
      "kind": "DirectiveDefinition",
      "name": {
        "kind": "Name",
        "value": "join__graph"
      },
      "arguments": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        }
      ],
      "repeatable": false,
      "locations": [
        {
          "kind": "Name",
          "value": "ENUM_VALUE"
        }
      ]
    },
    {
      "kind": "DirectiveDefinition",
      "name": {
        "kind": "Name",
        "value": "join__implements"
      },
      "arguments": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "graph"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "join__Graph"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "interface"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        }
      ],
      "repeatable": true,
      "locations": [
        {
          "kind": "Name",
          "value": "OBJECT"
        },
        {
          "kind": "Name",
          "value": "INTERFACE"
        }
      ]
    },
    {
      "kind": "DirectiveDefinition",
      "name": {
        "kind": "Name",
        "value": "join__type"
      },
      "arguments": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "graph"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "join__Graph"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "key"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "join__FieldSet"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "extension"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Boolean"
              }
            }
          },
          "defaultValue": {
            "kind": "BooleanValue",
            "value": false
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "resolvable"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Boolean"
              }
            }
          },
          "defaultValue": {
            "kind": "BooleanValue",
            "value": true
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "isInterfaceObject"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Boolean"
              }
            }
          },
          "defaultValue": {
            "kind": "BooleanValue",
            "value": false
          },
          "directives": []
        }
      ],
      "repeatable": true,
      "locations": [
        {
          "kind": "Name",
          "value": "OBJECT"
        },
        {
          "kind": "Name",
          "value": "INTERFACE"
        },
        {
          "kind": "Name",
          "value": "UNION"
        },
        {
          "kind": "Name",
          "value": "ENUM"
        },
        {
          "kind": "Name",
          "value": "INPUT_OBJECT"
        },
        {
          "kind": "Name",
          "value": "SCALAR"
        }
      ]
    },
    {
      "kind": "DirectiveDefinition",
      "name": {
        "kind": "Name",
        "value": "join__unionMember"
      },
      "arguments": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "graph"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "join__Graph"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "member"
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        }
      ],
      "repeatable": true,
      "locations": [
        {
          "kind": "Name",
          "value": "UNION"
        }
      ]
    },
    {
      "kind": "DirectiveDefinition",
      "name": {
        "kind": "Name",
        "value": "link"
      },
      "arguments": [
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "url"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "as"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "String"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "for"
          },
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "link__Purpose"
            }
          },
          "directives": []
        },
        {
          "kind": "InputValueDefinition",
          "name": {
            "kind": "Name",
            "value": "import"
          },
          "type": {
            "kind": "ListType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "link__Import"
              }
            }
          },
          "directives": []
        }
      ],
      "repeatable": true,
      "locations": [
        {
          "kind": "Name",
          "value": "SCHEMA"
        }
      ]
    },
    {
      "kind": "ScalarTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "join__FieldSet"
      },
      "directives": []
    },
    {
      "kind": "EnumTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "join__Graph"
      },
      "directives": [],
      "values": [
        {
          "kind": "EnumValueDefinition",
          "name": {
            "kind": "Name",
            "value": "PRODUCTS"
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__graph"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "name"
                  },
                  "value": {
                    "kind": "StringValue",
                    "value": "products",
                    "block": false
                  }
                },
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "url"
                  },
                  "value": {
                    "kind": "StringValue",
                    "value": "http://127.0.0.1:3075/",
                    "block": false
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "EnumValueDefinition",
          "name": {
            "kind": "Name",
            "value": "REVIEWS"
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__graph"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "name"
                  },
                  "value": {
                    "kind": "StringValue",
                    "value": "reviews",
                    "block": false
                  }
                },
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "url"
                  },
                  "value": {
                    "kind": "StringValue",
                    "value": "http://127.0.0.1:3085/",
                    "block": false
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "EnumValueDefinition",
          "name": {
            "kind": "Name",
            "value": "USERS"
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__graph"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "name"
                  },
                  "value": {
                    "kind": "StringValue",
                    "value": "users",
                    "block": false
                  }
                },
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "url"
                  },
                  "value": {
                    "kind": "StringValue",
                    "value": "http://127.0.0.1:3065/",
                    "block": false
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "kind": "ScalarTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "link__Import"
      },
      "directives": []
    },
    {
      "kind": "EnumTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "link__Purpose"
      },
      "directives": [],
      "values": [
        {
          "kind": "EnumValueDefinition",
          "description": {
            "kind": "StringValue",
            "value": "`SECURITY` features provide metadata necessary to securely resolve fields.",
            "block": true
          },
          "name": {
            "kind": "Name",
            "value": "SECURITY"
          },
          "directives": []
        },
        {
          "kind": "EnumValueDefinition",
          "description": {
            "kind": "StringValue",
            "value": "`EXECUTION` features provide metadata necessary for operation execution.",
            "block": true
          },
          "name": {
            "kind": "Name",
            "value": "EXECUTION"
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "description": {
        "kind": "StringValue",
        "value": "Define the Product entity so that we can extend it.",
        "block": true
      },
      "name": {
        "kind": "Name",
        "value": "Product"
      },
      "interfaces": [],
      "directives": [
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "PRODUCTS"
              }
            },
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "key"
              },
              "value": {
                "kind": "StringValue",
                "value": "id",
                "block": false
              }
            }
          ]
        },
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "REVIEWS"
              }
            },
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "key"
              },
              "value": {
                "kind": "StringValue",
                "value": "id",
                "block": false
              }
            }
          ]
        }
      ],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "id"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ID"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "PRODUCTS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "price"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "PRODUCTS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "reviews"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "ListType",
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "Review"
                  }
                }
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "REVIEWS"
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Query"
      },
      "interfaces": [],
      "directives": [
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "PRODUCTS"
              }
            }
          ]
        },
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "REVIEWS"
              }
            }
          ]
        },
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "USERS"
              }
            }
          ]
        }
      ],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "product"
          },
          "arguments": [
            {
              "kind": "InputValueDefinition",
              "name": {
                "kind": "Name",
                "value": "id"
              },
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "ID"
                  }
                }
              },
              "directives": []
            }
          ],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Product"
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "PRODUCTS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "products"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "ListType",
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "Product"
                  }
                }
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "PRODUCTS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "review"
          },
          "arguments": [
            {
              "kind": "InputValueDefinition",
              "name": {
                "kind": "Name",
                "value": "id"
              },
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "ID"
                  }
                }
              },
              "directives": []
            }
          ],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Review"
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "REVIEWS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "reviews"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "ListType",
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "Review"
                  }
                }
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "REVIEWS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "me"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "User"
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "USERS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "users"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "ListType",
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "User"
                  }
                }
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "USERS"
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "name": {
        "kind": "Name",
        "value": "Review"
      },
      "interfaces": [],
      "directives": [
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "REVIEWS"
              }
            },
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "key"
              },
              "value": {
                "kind": "StringValue",
                "value": "id",
                "block": false
              }
            }
          ]
        }
      ],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "id"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ID"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "body"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "author"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "User"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "product"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Product"
              }
            }
          },
          "directives": []
        }
      ]
    },
    {
      "kind": "ObjectTypeDefinition",
      "description": {
        "kind": "StringValue",
        "value": "Define the User entity so that we can extend it.",
        "block": true
      },
      "name": {
        "kind": "Name",
        "value": "User"
      },
      "interfaces": [],
      "directives": [
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "PRODUCTS"
              }
            },
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "key"
              },
              "value": {
                "kind": "StringValue",
                "value": "id",
                "block": false
              }
            }
          ]
        },
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "REVIEWS"
              }
            },
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "key"
              },
              "value": {
                "kind": "StringValue",
                "value": "id",
                "block": false
              }
            }
          ]
        },
        {
          "kind": "Directive",
          "name": {
            "kind": "Name",
            "value": "join__type"
          },
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "graph"
              },
              "value": {
                "kind": "EnumValue",
                "value": "USERS"
              }
            },
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "key"
              },
              "value": {
                "kind": "StringValue",
                "value": "id",
                "block": false
              }
            }
          ]
        }
      ],
      "fields": [
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "id"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "ID"
              }
            }
          },
          "directives": []
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "purchases"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "ListType",
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "Product"
                  }
                }
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "PRODUCTS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "reviews"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "ListType",
              "type": {
                "kind": "NonNullType",
                "type": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "Review"
                  }
                }
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "REVIEWS"
                  }
                }
              ]
            }
          ]
        },
        {
          "kind": "FieldDefinition",
          "name": {
            "kind": "Name",
            "value": "name"
          },
          "arguments": [],
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "String"
              }
            }
          },
          "directives": [
            {
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "join__field"
              },
              "arguments": [
                {
                  "kind": "Argument",
                  "name": {
                    "kind": "Name",
                    "value": "graph"
                  },
                  "value": {
                    "kind": "EnumValue",
                    "value": "USERS"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}