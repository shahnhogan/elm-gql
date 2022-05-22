export default (): string => "module GraphQL.Operations.CanonicalAST exposing (..)\n\nimport GraphQL.Operations.AST as AST\nimport GraphQL.Schema\n\n\ntype alias Document =\n    { definitions : List Definition\n    }\n\n\ntype Definition\n    = Operation OperationDetails\n\n\ntype alias OperationDetails =\n    { operationType : OperationType\n    , name : Maybe Name\n    , variableDefinitions : List VariableDefinition\n    , directives : List Directive\n    , fields : List Selection\n    }\n\n\ntype OperationType\n    = Query\n    | Mutation\n\n\ntype alias Directive =\n    { name : Name\n    , arguments : List Argument\n    }\n\n\ntype alias Argument =\n    AST.Argument\n\n\ntype alias VariableDefinition =\n    { variable : Variable\n    , type_ : AST.Type\n    , defaultValue : Maybe AST.Value\n    , schemaType : GraphQL.Schema.Type\n    }\n\n\ntype alias Variable =\n    { name : Name\n    }\n\n\ntype Selection\n    = FieldObject FieldObjectDetails\n    | FieldUnion FieldUnionDetails\n    | FieldScalar FieldScalarDetails\n    | FieldEnum FieldEnumDetails\n    | FieldInterface FieldInterfaceDetails\n\n\nisTypeNameSelection : Selection -> Bool\nisTypeNameSelection sel =\n    case sel of\n        FieldScalar scal ->\n            nameToString scal.name == \"__typename\"\n\n        _ ->\n            False\n\n\ntype alias FieldDetails =\n    { alias_ : Maybe Name\n    , name : Name\n    , arguments : List Argument\n    , directives : List Directive\n    , selection : List Selection\n    }\n\n\n{-|\n\n    - name        -> the field name in the schema\n    - alias_      -> the alias provided in the query\n    - globalAlias ->\n            The name that's guaranteed to be unique for the query.\n            This is used to generate record types for the results of an operation.\n\n-}\ntype alias FieldObjectDetails =\n    { alias_ : Maybe Name\n    , name : Name\n    , globalAlias : Name\n    , arguments : List Argument\n    , directives : List Directive\n    , selection : List Selection\n    , object : GraphQL.Schema.ObjectDetails\n    , wrapper : GraphQL.Schema.Wrapped\n    }\n\n\ntype alias FieldUnionDetails =\n    { alias_ : Maybe Name\n    , name : Name\n    , globalAlias : Name\n    , arguments : List Argument\n    , directives : List Directive\n    , selection : List Selection\n    , variants : List UnionCaseDetails\n    , remainingTags :\n        List\n            { tag : Name\n            , globalAlias : Name\n            }\n    , union : GraphQL.Schema.UnionDetails\n    , wrapper : GraphQL.Schema.Wrapped\n    }\n\n\ntype alias FieldInterfaceDetails =\n    { alias_ : Maybe Name\n    , name : Name\n    , globalAlias : Name\n    , arguments : List Argument\n    , directives : List Directive\n    , selection : List Selection\n    , variants : List InterfaceCase\n    , remainingTags :\n        List\n            { tag : Name\n            , globalAlias : Name\n            }\n    , interface : GraphQL.Schema.InterfaceDetails\n    , wrapper : GraphQL.Schema.Wrapped\n    }\n\n\ntype alias InterfaceCase =\n    { tag : Name\n    , globalAlias : Name\n    , directives : List Directive\n    , selection : List Selection\n    }\n\n\ntype alias FieldScalarDetails =\n    { alias_ : Maybe Name\n    , name : Name\n    , arguments : List Argument\n    , directives : List Directive\n    , type_ : GraphQL.Schema.Type\n    }\n\n\ntype alias FieldEnumDetails =\n    { alias_ : Maybe Name\n    , name : Name\n    , arguments : List Argument\n    , directives : List Directive\n    , enumName : String\n    , values : List { name : String, description : Maybe String }\n    , wrapper : GraphQL.Schema.Wrapped\n    }\n\n\ntype alias UnionCaseDetails =\n    { tag : Name\n    , globalAlias : Name\n    , directives : List Directive\n    , selection : List Selection\n    }\n\n\ntype Name\n    = Name String\n\n\ngetAliasedName : Selection -> String\ngetAliasedName sel =\n    case sel of\n        FieldObject details ->\n            nameToString (Maybe.withDefault details.name details.alias_)\n\n        FieldUnion details ->\n            nameToString (Maybe.withDefault details.name details.alias_)\n\n        FieldScalar details ->\n            nameToString (Maybe.withDefault details.name details.alias_)\n\n        FieldEnum details ->\n            nameToString (Maybe.withDefault details.name details.alias_)\n\n        FieldInterface details ->\n            nameToString (Maybe.withDefault details.name details.alias_)\n\n\nnameToString : Name -> String\nnameToString (Name str) =\n    str\n\n\n\n{- To String -}\n\n\n{-| -}\ntoString : Definition -> String\ntoString (Operation def) =\n    let\n        opName =\n            case def.name of\n                Nothing ->\n                    \"\"\n\n                Just (Name str) ->\n                    str\n\n        variableDefinitions =\n            case def.variableDefinitions of\n                [] ->\n                    \"\"\n\n                vars ->\n                    let\n                        renderedVars =\n                            foldToString \", \"\n                                (\\var ->\n                                    \"$\"\n                                        ++ nameToString var.variable.name\n                                        ++ \": \"\n                                        ++ typeToString (getWrapper var.type_ (Val { required = True })) var.type_\n                                )\n                                vars\n                    in\n                    \"(\" ++ renderedVars ++ \")\"\n    in\n    operationName def.operationType\n        ++ \" \"\n        ++ opName\n        ++ variableDefinitions\n        ++ \" \"\n        ++ brackets\n            (foldToString \"\\n\" selectionToString def.fields)\n\n\nselectionToString : Selection -> String\nselectionToString sel =\n    case sel of\n        FieldObject details ->\n            selectFieldToString details\n\n        FieldUnion details ->\n            aliasedName details\n                ++ brackets\n                    (foldToString \"\\n\" selectionToString details.selection\n                        ++ foldToString \"\\n\" unionCaseToString details.variants\n                    )\n\n        FieldScalar details ->\n            aliasedName details\n\n        FieldEnum details ->\n            aliasedName details\n\n        FieldInterface details ->\n            aliasedName details\n                ++ brackets\n                    (foldToString \"\\n\" selectionToString details.selection\n                        ++ foldToString \"\\n\" interfaceCaseToString details.variants\n                    )\n\n\nunionCaseToString : UnionCaseDetails -> String\nunionCaseToString instance =\n    \"... on \"\n        ++ nameToString instance.tag\n        ++ \" \"\n        ++ brackets (foldToString \"\\n\" selectionToString instance.selection)\n\n\ninterfaceCaseToString : InterfaceCase -> String\ninterfaceCaseToString instance =\n    \"... on \"\n        ++ nameToString instance.tag\n        ++ \" \"\n        ++ brackets (foldToString \"\\n\" selectionToString instance.selection)\n\n\nselectFieldToString :\n    { a\n        | selection : List Selection\n        , alias_ : Maybe Name\n        , name : Name\n        , arguments : List Argument\n    }\n    -> String\nselectFieldToString details =\n    let\n        arguments =\n            case details.arguments of\n                [] ->\n                    \"\"\n\n                _ ->\n                    \"(\"\n                        ++ foldToString \"\\n\" argToString details.arguments\n                        ++ \")\"\n\n        selection =\n            case details.selection of\n                [] ->\n                    \"\"\n\n                _ ->\n                    \" \"\n                        ++ brackets (foldToString \"\\n\" selectionToString details.selection)\n    in\n    aliasedName details ++ arguments ++ selection\n\n\nargToString : Argument -> String\nargToString arg =\n    AST.nameToString arg.name ++ \": \" ++ argValToString arg.value\n\n\nargValToString : AST.Value -> String\nargValToString val =\n    case val of\n        AST.Str str ->\n            \"\\\"\" ++ str ++ \"\\\"\"\n\n        AST.Integer int ->\n            String.fromInt int\n\n        AST.Decimal dec ->\n            String.fromFloat dec\n\n        AST.Boolean True ->\n            \"true\"\n\n        AST.Boolean False ->\n            \"false\"\n\n        AST.Null ->\n            \"null\"\n\n        AST.Enum (AST.Name str) ->\n            str\n\n        AST.Var var ->\n            \"$\" ++ AST.nameToString var.name\n\n        AST.Object keyVals ->\n            brackets\n                (foldToString \", \"\n                    (\\( key, innerVal ) ->\n                        AST.nameToString key ++ \": \" ++ argValToString innerVal\n                    )\n                    keyVals\n                )\n\n        AST.ListValue vals ->\n            \"[\"\n                ++ foldToString \", \" argValToString vals\n                ++ \"]\"\n\n\naliasedName : { a | alias_ : Maybe Name, name : Name } -> String\naliasedName details =\n    case details.alias_ of\n        Nothing ->\n            nameToString details.name\n\n        Just alias_ ->\n            nameToString alias_ ++ \": \" ++ nameToString details.name\n\n\nfoldToString : String -> (a -> String) -> List a -> String\nfoldToString delimiter fn vals =\n    List.foldl\n        (\\var rendered ->\n            let\n                val =\n                    fn var\n            in\n            case rendered of\n                \"\" ->\n                    val\n\n                _ ->\n                    val ++ delimiter ++ rendered\n        )\n        \"\"\n        vals\n\n\noperationName : OperationType -> String\noperationName opType =\n    case opType of\n        Query ->\n            \"query\"\n\n        Mutation ->\n            \"mutation\"\n\n\nbrackets : String -> String\nbrackets str =\n    \"{\" ++ str ++ \"}\"\n\n\ntype Wrapper\n    = InList { required : Bool } Wrapper\n    | Val { required : Bool }\n\n\n{-|\n\n    Type ->\n        Required Val\n\n    Nullable Type ->\n        Val\n\n-}\ngetWrapper : AST.Type -> Wrapper -> Wrapper\ngetWrapper t wrap =\n    case t of\n        AST.Type_ _ ->\n            wrap\n\n        AST.List_ inner ->\n            getWrapper inner (InList { required = True } wrap)\n\n        AST.Nullable inner ->\n            case wrap of\n                Val { required } ->\n                    getWrapper inner (Val { required = False })\n\n                InList { required } wrapper ->\n                    getWrapper inner (InList { required = False } wrapper)\n\n\ntypeToString : Wrapper -> AST.Type -> String\ntypeToString wrapper t =\n    case t of\n        AST.Type_ (AST.Name str) ->\n            unwrap wrapper str\n\n        AST.List_ inner ->\n            typeToString wrapper inner\n\n        AST.Nullable inner ->\n            typeToString wrapper inner\n\n\nunwrap : Wrapper -> String -> String\nunwrap wrapper str =\n    case wrapper of\n        Val { required } ->\n            if required then\n                str ++ \"!\"\n\n            else\n                str\n\n        InList { required } inner ->\n            if required then\n                unwrap inner (\"[\" ++ str ++ \"!]\")\n\n            else\n                unwrap inner (\"[\" ++ str ++ \"]\")\n"